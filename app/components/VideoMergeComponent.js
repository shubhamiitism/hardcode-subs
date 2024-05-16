import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const VideoMergeComponent = ({ subtitleFile, videoFile, onMergeCompleted }) => {
    const [loaded, setLoaded] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef(null);
    const messageRef = useRef(null);

    const load = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on('log', ({ message }) => {
            messageRef.current.innerHTML = message;
            console.log(message);
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setLoaded(true);
    }

    const transcode = async () => {
        const ffmpeg = ffmpegRef.current;
        // Write subtitle file and video file from upload folder
        await ffmpeg.writeFile('subs.srt', await fetchFile(subtitleFile));
        await ffmpeg.writeFile('vid.mp4', await fetchFile(videoFile));

        // Transcode and add subtitles using FFmpeg command
        await ffmpeg.exec([
            '-i', 'vid.mp4',
            '-vf', `subtitles=subs.srt:force_style='FontName=Arial,FontSize=24,PrimaryColour=white,OutlineColour=black,Outline=1,BorderStyle=3,Shadow=2,Alignment=2'`,
            'output.mp4',
        ]);

        // Read transcoded output file
        const data = await ffmpeg.readFile('output.mp4');
        // Set video source to Blob URL for playback
        videoRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    }

    // return (
    //     <div>
    //         {loaded ? (
    //             <button onClick={load}>Merge Subtitles and Video</button>
    //         ) : (
    //             <p>Loading FFmpeg...</p>
    //         )}
    //     </div>
    // );
    return (loaded
        ? (
            <>
                <video ref={videoRef} controls></video><br/>
                <button onClick={transcode}>Transcode and Add Subtitles</button>
                <p ref={messageRef}></p>
            </>
        )
        : (
            <button onClick={load}>Load ffmpeg-core</button>
        )
    );
};

export default VideoMergeComponent;
