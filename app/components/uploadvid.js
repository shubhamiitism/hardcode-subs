import React from 'react';
import '../styles/styles.css';

const UploadVideo = ({ onVideoUpload }) => {
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
};

export default UploadVideo;
