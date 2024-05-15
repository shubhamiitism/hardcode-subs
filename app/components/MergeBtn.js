import React from 'react';
import VideoMergeComponent from './VideoMergeComponent.js'; // Import the VideoMergeComponent
import '../styles/styles.css';

const MergeBtn = ({ onClickMerge }) => {
    return (
        <>
            <VideoMergeComponent /> {/* Use the VideoMergeComponent here */}
            <button className="merge-btn" onClick={onClickMerge}>Merge Subtitle and Video</button>
        </>
    );
};

export default MergeBtn;
