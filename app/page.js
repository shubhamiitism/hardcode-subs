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

    const handleClickMerge = () => {
        console.log('Merging Subtitles and video files....');
    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        setVideoFile(file);
    };

    const handleSubtitleUpload = (e) => {
        const file = e.target.files[0];
        setSubtitleFile(file);
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

    const transcode = async () => {
        try {
            const videoInput = document.querySelector('#video');
            const subtitleInput = document.querySelector('#subtitle');
            console.log("Inf", videoInput, subtitleInput);
            const ffmpeg = ffmpegRef.current;
            const { fetchFile } = await import('@ffmpeg/util');
            await ffmpeg.writeFile('vid.mp4', await fetchFile(videoFile));
            await ffmpeg.writeFile('arial.ttf', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf'));
            await ffmpeg.exec([
                '-i', 'vid.mp4',
                '-vf', 'drawtext=fontfile=/arial.ttf:text=\'ffmpeg.wasm\':x=10:y=10:fontsize=24:fontcolor=white',
                'output.mp4',
            ]);
            const data = await ffmpeg.readFile('output.mp4');
            videoRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
            onMergeCompleted();
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
