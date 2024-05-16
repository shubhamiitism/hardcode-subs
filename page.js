'use client'
import MergeBtn from './components/MergeBtn';
import React, { useState, useEffect, useRef } from 'react';
import './styles/styles.css';

function UploadSubtitle({ onSubtitleUpload }) {
    const handleSubtitleUpload = (e) => {
        const file = e.target.files[0]; // Get the selected file
        onSubtitleUpload(file); // Pass the file to the parent component
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '10px',
            marginTop: '50px'
            }}>
            <label htmlFor="subtitle">Upload Subtitle File:</label>
            <input className="upload-btn"
                type="file"
                id="subtitle"
                accept=".srt,.vtt,.ass, .txt" // Specify accepted file formats
                onChange={handleSubtitleUpload}
            />
        </div>
    );
}

function UploadVideo({ onVideoUpload }) {
    const handleVideoUpload = (e) => {
        const file = e.target.files[0]; // Get the selected file
        onVideoUpload(file); // Pass the file to the parent component
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '70px',
            marginBottom: '70px',
        }}>
            <label htmlFor="video">Upload Video File:</label>
            <input
                type="file"
                id="video"
                accept=".wav,.mp4, .mp3, video/*" // Accept any video format
                onChange={handleVideoUpload}
            />
        </div>
    );
}

function VideoMergeComponent({ subtitleFile, videoFile, onMergeCompleted }) {
    const [loaded, setLoaded] = useState(false);
    const videoRef = useRef(null);
    const messageRef = useRef(null);
    const ffmpegRef = useRef(null);

    useEffect(() => {
        const loadFFmpeg = async () => {
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
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
        }

        if (typeof window !== 'undefined') {
            loadFFmpeg();
        }
    }, []);

    const transcode = async () => {
        console.log("Inf", subtitleFile, videoFile);
        try {
            const ffmpeg = ffmpegRef.current;
            const { fetchFile } = await import('@ffmpeg/util');
            await ffmpeg.writeFile('vid.mp4', await fetchFile(videoFile));
            await ffmpeg.writeFile('arial.ttf', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf'));
            console.log("Executing");
            await ffmpeg.exec([
                '-i',
                'vid.mp4',
                '-vf',
                'drawtext=fontfile=/arial.ttf:text=\'ffmpeg.wasm\':x=10:y=10:fontsize=24:fontcolor=white',
                'output.mp4',
            ]);
            const data = await ffmpeg.readFile('output.mp4');
            videoRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        } catch (error) {
            console.error('Error during FFmpeg command execution:', error);
            // Handle error appropriately
        }
    }

    return (
        loaded && (
            <>
                <video ref={videoRef} controls></video><br />
                <button onClick={transcode}>Transcode and Add Subtitles</button>
                <p ref={messageRef}></p>
                <p>Open Developer Tools (Ctrl+Shift+I) to View Logs</p>
            </>
        )
    );
}

const IndexPage = () => {
    const [subtitleFile, setSubtitleFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [mergeCompleted, setMergeCompleted] = useState(false);

    const handleSubtitleUpload = (file) => {
        setSubtitleFile(file);
        console.log("Sub", file);
    };

    const handleVideoUpload = (file) => {
        setVideoFile(file);
        console.log("Vid", file);
    };

    const handleClickMerge = () => {
        console.log('Merging Subtitles and video files....')
        // Trigger the merging process here
        // You can call functions from VideoMergeComponent or use other logic
    };

    const handleMergeCompleted = () => {
        setMergeCompleted(true);
    };

    return (
        <div>
            <h1>Upload Subtitle and Video Files</h1>
            <UploadSubtitle onSubtitleUpload={handleSubtitleUpload} />
            <UploadVideo onVideoUpload={handleVideoUpload} />
            {mergeCompleted ? (
                <div>
                    <h2>Merge Completed!</h2>
                    {/* Show merged video or provide download link */}
                </div>
            ) : (
                <>
                    <MergeBtn onClickMerge={handleClickMerge} />
                    <VideoMergeComponent
                        subtitleFile={subtitleFile}
                        videoFile={videoFile}
                        onMergeCompleted={handleMergeCompleted}
                    />
                </>
            )}
        </div>
    );
};

export default IndexPage;
