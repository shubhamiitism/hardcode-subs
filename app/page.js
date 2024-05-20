'use client'
import React, { useState, useEffect, useRef } from 'react';
import './styles/styles.css';

const IndexPage = () => {
    const [subtitleFile, setSubtitleFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [mergeCompleted, setMergeCompleted] = useState(false);

    const handleMergeCompleted = () => setMergeCompleted(true);
    
    const [loaded, setLoaded] = useState(false);
    const videoRef = useRef(null);
    const messageRef = useRef(null);
    const ffmpegRef = useRef(null);

    const handleClickMerge = async () => {
        if (videoFile && subtitleFile) {
            await transcode(); //new
            handleMergeCompleted();
        } else {
            alert('Please upload both video and subtitle files.');
        }

    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        setVideoFile(file);
        console.log('vid uploaded..');

        // // Assuming you have a video element in your HTML with an id "myVideo"
        // const video = document.getElementById('videoFile');

        // // Add an event listener for the 'pause' event
        // video.addEventListener('pause', () => {
        //     // Get the current time when the video is paused
        //     const currentTime = video.currentTime;
        //     console.log('Video paused at:', currentTime);
        // });
    };



    const handleSubtitleUpload = (e) => {
        const file = e.target.files[0];
        setSubtitleFile(file);
        console.log('subs uploaded...');
    };

    useEffect(() => {
        const loadFFmpeg = async () => {
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            const { FFmpeg } = await import('@ffmpeg/ffmpeg');
            const { toBlobURL } = await import('@ffmpeg/util');
            const ffmpeg = new FFmpeg();
            ffmpegRef.current = ffmpeg;
            ffmpeg.on('log', ({ message }) => {
                messageRef.current.innerHTML = message;
                console.log(message);
            });
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
        };

        loadFFmpeg();
    }, []);

    const parseSRT = (srt) => {
        const regex = /\[(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\]\s+(.*)/g;
        let match;
        const entries = [];
        
        while ((match = regex.exec(srt)) !== null) {
            entries.push({
                start: match[1],
                end: match[2],
                text: match[3].trim()     // Trim to remove any leading/trailing whitespace.
            });
        }
        return entries;
    };

    const srtTimeToSeconds = (time) => {
        const [hours, minutes, seconds] = time.split(':');
        return parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseFloat(seconds);
    };


    const transcode = async () => {
        try {
            const videoInput = document.querySelector('#video');
            const subtitleInput = document.querySelector('#subtitle');
            const subtitles = parseSRT(subtitleInput);
            console.log("Inf", videoInput, subtitleInput);
            
            const ffmpeg = ffmpegRef.current;
            const { fetchFile } = await import('@ffmpeg/util');
            await ffmpeg.writeFile('vid.mp4', await fetchFile(videoFile));
            await ffmpeg.writeFile('subs.srt', await fetchFile(subtitleFile));
            
            //
            let filter = '';
            subtitles.forEach(({ start, end, text }, index) => {
                const startTime = srtTimeToSeconds(start);
                const endTime = srtTimeToSeconds(end);
                filter += `drawtext=fontfile=subs.srt:text='${text.replace(/'/g, "\\'")}':x=10:y=10:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.5:enable='between(t,${startTime},${endTime})',`;
            });
            
            filter = filter.slice(0, -1);
            //

            await ffmpeg.exec([
                '-i', 'vid.mp4',
                //'-vf', 'drawtext=fontfile=/arial.ttf:text=\'ffmpeg.wasm\':x=10:y=10:fontsize=24:fontcolor=white',
                '-vf', filter,   //new
                '-c:a', 'copy',    //new
                'output.mp4',
            ]);
            const data = await ffmpeg.readFile('output.mp4');
            videoRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
            // onMergeCompleted();
        } catch (error) {
            console.error('Error during FFmpeg command execution:', error);
        }
    };

    return (
        <div>
            <h1>Upload Subtitle and Video Files</h1>
            <div className="upload-container">
                <label htmlFor="subtitle">Upload Subtitle File:</label>
                <input className="upload-btn" type="file" id="subtitle" accept=".srt,.vtt,.ass,.txt" onChange={handleSubtitleUpload} />
            </div>
            <div className="upload-container">
                <label htmlFor="video">Upload Video File:</label>
                <input type="file" id="video" accept=".wav,.mp4,.mp3,video/*" onChange={handleVideoUpload} />
            </div>
            {mergeCompleted ? (
                <div>
                    <h2>Merge Completed!</h2>
                </div>
            ) : (
                <>
                    <button className="merge-btn" onClick={handleClickMerge}>Merge Subtitle and Video</button>

                    {loaded && (
                    <div>
                      <video ref={videoRef} controls></video>
                      <button onClick={transcode}>Transcode and Add Subtitles</button>
                      <p ref={messageRef}></p>
                      <p>Open Developer Tools (Ctrl+Shift+I) to View Logs</p>
                    </div>
                    )}
                </>
            )}
        </div>
    );
};

export default IndexPage;
