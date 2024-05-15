import React from 'react';
import '../styles/styles.css';

const UploadSubtitle = ({ onSubtitleUpload }) => {
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
};

export default UploadSubtitle;

