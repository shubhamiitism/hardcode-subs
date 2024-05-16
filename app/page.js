'use client'
import React, { useState, useRef } from 'react';
import UploadSubtitle from './components/uploadsubs';
import UploadVideo from './components/uploadvid';
import styles from './styles/styles.css';
import MergeBtn from './components/MergeBtn';
import VideoMergeComponent from './components/VideoMergeComponent'; // Import the VideoMergeComponent

const IndexPage = () => {
    const [subtitleFile, setSubtitleFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [mergeCompleted, setMergeCompleted] = useState(false);

    const handleSubtitleUpload = (file) => {
        setSubtitleFile(file);
    };

    const handleVideoUpload = (file) => {
        setVideoFile(file);
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
                        subtitleFile={'./components/uploads/subs.srt'}
                        videoFile={'./components/uploads/vid.mp4'}
                        onMergeCompleted={handleMergeCompleted}
                    />
                </>
            )}
        </div>
    );
};

export default IndexPage;
