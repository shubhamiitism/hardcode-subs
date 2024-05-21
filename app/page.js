'use client'
import React, { useState, useEffect, useRef } from 'react';
import './styles/styles.css';
import SubtitlesParser from 'subtitles-parser';

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
            const subtitleData = await subtitleFile.text();
            console.log("Inf", videoInput, subtitleInput);
            
            // const subtitles = parseSRT("[00:00:00.000 --> 00:00:01.000] [music]\n  [00:00:01.000 --> 00:00:06.000]   And Ill learn to get along and throw your back from outer space. \n  [00:00:06.000 --> 00:00:10.000] I just walked in and found you here with that said look upon your face. \n   [00:00:10.000 --> 00:00:12.000]   I should have changed that stupid lock.\n   [00:00:12.000 --> 00:00:14.000]   I should have made you leave your key. \n     [00:00:14.000 --> 00:00:19.000]   If I had no for just one second youd be back to bottom here go on now go. \n  [00:00:19.000 --> 00:00:21.000]   Walk out the door. \n [00:00:21.000 --> 00:00:22.000]   Frank \n [00:00:22.000 --> 00:00:26.000]   Bring your head in this window while I roll it up in there. \n [00:00:26.000 --> 00:00:27.000] Got it. \n [00:00:27.000 --> 00:00:33.000]   [music] \n [00:00:33.000 --> 00:00:34.000]   Frank");

            const ffmpeg = ffmpegRef.current;
            const { fetchFile } = await import('@ffmpeg/util');
            await ffmpeg.writeFile('vid.mp4', await fetchFile(videoFile));
            await ffmpeg.writeFile('arial.ttf', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf'));
            
            // Parse the SRT file using SubtitlesParser (srtparser)
            
            const srtData = await readSubtitleFile(subtitleFile);
            const subtitles = parseSRT(srtData);
            console.log('Subtitles:', subtitles);

            let filter = '';
            console.log("filter1: ", filter);

            subtitles.forEach(({ start, end, text }) => {
                const startTime = srtTimeToSeconds(start);
                const endTime = srtTimeToSeconds(end);
                filter+= `drawtext=fontfile=/arial.ttf:text='${text.replace(/'/g, "\\'")}':x=10:y=10:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.5:enable='between(t,${startTime},${endTime})',`;
                console.log("filter2: ", filter);
            }); 
            console.log("filter3: ", filter);
            filter = filter.slice(0, -1);
            console.log("filter4: ", filter);

            if (!filter) {
                throw new Error('No valid subtitle entries found.');
            }

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

    const readSubtitleFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
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
