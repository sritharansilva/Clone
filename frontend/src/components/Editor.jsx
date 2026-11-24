import React from 'react';
import { Check, ImagePlus, LoaderCircle, X } from 'lucide-react';
import { api } from '../lib/api';

// >>>  SAME WORDING in PostList.jsx.

const LOCATIONS = ['Selangor'];
const STUDIO_TYPES = ['Videography / Photography studio', 'Podcast / recording', 'Dance / fitness', 'Event / workshop', 'Other'];

const fieldStyle = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  font: 'inherit',
  fontSize: 14,
  border: '1px solid #e3e6ee',
  borderRadius: 8,
  background: '#fff',
  color: '#1f2430',
  boxSizing: 'border-box'
};

export default function Editor({
  post,
  onClose,
  onSaved
}) {
  const [title, setTitle] = React.useState(post?.title || '');
  const [body, setBody] = React.useState(post?.body || '');
  const [location, setLocation] = React.useState(post?.location || '');
  const [studioType, setStudioType] = React.useState(post?.studio_type || '');
  const [price, setPrice] = React.useState(post?.price_per_hour ?? '');
  const [image, setImage] = React.useState(null);
  const [removeImage, setRemoveImage] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const preview = React.useMemo(() => image ? URL.createObjectURL(image) : null, [image]);
  React.useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('body', body.trim());
      form.append('location', location);
      form.append('studio_type', studioType);
      form.append('price_per_hour', price === '' ? '' : String(price));
      if (image) form.append('image', image);
      if (removeImage) form.append('remove_existing_image', 'true');
      await api(post ? `/posts/${post.id}` : '/posts', {
        method: post ? 'PUT' : 'POST',
        body: form
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <div className="modal editor-modal">
      <div className="modal-head">
        <div>
          <div className="eyebrow muted">YOUR STORY</div>
          <h2>
            {post ? 'Edit your post' : 'Write something new'}
          </h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          <X size={21} />
        </button>
      </div>
      <form onSubmit={submit}>
        <label>Title<input value={title} maxLength={160} required onChange={event => setTitle(event.target.value)} placeholder="Give your story a title" /></label>
        <label>Your story<textarea value={body} maxLength={20000} required onChange={event => setBody(event.target.value)} placeholder="Start writing here..." rows={8} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, margin: '0 0 16px' }}>
          <label>Location
            <select style={fieldStyle} value={location} onChange={event => setLocation(event.target.value)}>
              <option value="">Select location</option>
              {LOCATIONS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Studio type
            <select style={fieldStyle} value={studioType} onChange={event => setStudioType(event.target.value)}>
              <option value="">Select type</option>
              {STUDIO_TYPES.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Price per hour (RM)
            <input style={fieldStyle} type="number" min="0" step="1" inputMode="decimal" value={price} onChange={event => setPrice(event.target.value)} placeholder="e.g. 80" />
          </label>
        </div>
        <label className="image-label">Cover image <span>Optional · PNG, JPG or WebP · max 5 MB</span></label>
        <label className="upload-box">
          {preview || post?.image_url && !removeImage ? <img src={preview || post.image_url} alt="Cover preview" /> : <>
            <ImagePlus size={25} />
            <span>Click to upload an image</span>
          </>}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
            setImage(event.target.files?.[0] || null);
            setRemoveImage(false);
          }} />
        </label>
        {post?.image_url && !image && !removeImage && <button className="remove-image" type="button" onClick={() => setRemoveImage(true)}>Remove current image</button>}
        {error && <div className="notice error">
          {error}
        </div>}
        <div className="modal-actions">
          <button className="button button-outline" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-dark" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}
            {" "}
            {busy ? 'Saving...' : post ? 'Save changes' : 'Publish post'}
          </button>

        </div>
      </form>
    </div>
  </div>;
}
