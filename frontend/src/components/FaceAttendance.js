import React, { useState } from 'react';
import axios from 'axios';
import Alert from './Alert';

const FaceAttendance = () => {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Vui lòng chọn ảnh khuôn mặt');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append('image', image);
    try {
      const res = await axios.post('/api/attendance/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(res.data.message || 'Chấm công thành công!');
    } catch (err) {
      if (err.response?.data?.error === 'Chỉ được chấm công từ mạng nội bộ') {
        setError('Bạn chỉ có thể chấm công khi kết nối mạng nội bộ công ty.');
      } else {
        setError(err.response?.data?.error || 'Chấm công thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="face-attendance-container">
      <h2>Chấm công bằng khuôn mặt</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Chấm công'}
        </button>
      </form>
      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}
    </div>
  );
};

export default FaceAttendance;
