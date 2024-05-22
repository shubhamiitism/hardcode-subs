'use client'
import React, { useState, useEffect, useRef } from 'react';
import './styles/styles.css';

const IndexPage = () => {
    const [subtitleFile, setSubtitleFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoDuration, setVideoDuration] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadLink, setDownloadLink] = useState('');
    const ffmpegRef = useRef(null);

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        setVideoFile(file);
        
        // Create a video element to extract the duration
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = () => {
            setVideoDuration(videoElement.duration);
        };
        videoElement.src = URL.createObjectURL(file);
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
                const timeMatch = message.match(/time=\s*(\d+:\d+:\d+\.\d+)/);
                if (timeMatch) {
                    const [hours, minutes, seconds] = timeMatch[1].split(':').map(parseFloat);
                    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                    if (videoDuration) {
                        setProgress((totalSeconds / videoDuration) * 100);
                    }
                }
            });
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
        };

        loadFFmpeg();
    }, [videoDuration]);

    const triggerDownload = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const transcode = async () => {
        setProcessing(true);
        setProgress(0);
        try {

            const ffmpeg = ffmpegRef.current;
            const { fetchFile } = await import('@ffmpeg/util');
            await ffmpeg.writeFile('vid.mp4', await fetchFile(videoFile));
            await ffmpeg.writeFile('vid.srt', await fetchFile(subtitleFile));
            await ffmpeg.writeFile('tmp/arial.ttf', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf'));

            await ffmpeg.exec([
            '-i',
            'vid.mp4',
            '-vf',
            `subtitles=vid.srt:fontsdir=/tmp:force_style='Fontname=Arial,fontsize=24,fontcolor=white'`,
            'output.mp4',
            ])
            
            const data = await ffmpeg.readFile('output.mp4');
            const videoURL = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
            setDownloadLink(videoURL);

            // Automatically trigger download
            triggerDownload(videoURL, 'output.mp4');
        } catch (error) {
            console.error('Error during FFmpeg command execution:', error);
        }
        setProcessing(false);
        setProgress(100);
    };

    return (
        <div className="container">
            <h1>Add Subtitle to Video</h1>
            <div className="upload-container">
                <label htmlFor="subtitle">Upload SRT File:</label>
                <input className="upload-btn" type="file" id="subtitle" accept=".srt" onChange={handleSubtitleUpload} />
            </div>
            <div className="upload-container">
                <label htmlFor="video">Upload Video:</label>
                <input className="upload-btn" type="file" id="video" accept=".mp4,video/*" onChange={handleVideoUpload} />
            </div>
            {loaded && (
                <div className="actions">
                    {processing ? (
                        <div>
                            <div className="loader">Processing...</div>
                            <div className="progress-bar">
                                <div className="progress" style={{ width: `${progress}%` }}>
                                    {Math.round(progress)}%
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                                <button className="merge-btn" onClick={transcode}>Add Subtitles</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default IndexPage;
