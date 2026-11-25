import React from 'react';
import { ArrowRight, ArrowUpDown, BookOpen, LoaderCircle, Plus, Search, X } from 'lucide-react';

// >>> SAME WORDING in Editor.jsx.

const LOCATIONS = ['Selangor'];
const STUDIO_TYPES = ['Videography / Photography studio', 'Podcast / recording', 'Dance / fitness', 'Event / workshop'];
const PRICE_RANGES = [
  { value: '0-50', label: 'Under RM50 / hr' },
  { value: '50-100', label: 'RM50 – RM100 / hr' },
  { value: '100-200', label: 'RM100 – RM200 / hr' },
  
];

function inPriceRange(price, range) {
  if (!range) return true;
  if (price == null || price == undefined || price == '') return false;
  const amount = Number(price);
  if (Number.isNaN(amount)) return false;
  if (range.endsWith('+')) return amount >= Number(range.slice(0, -1));
  const [min, max] = range.split('-').map(Number);
  return amount >= min && amount < max;
}

const selectStyle = {
  padding: '10px 12px',
  font: 'inherit',
  fontSize: 14,
  border: '1px solid #e3e6ee',
  borderRadius: 8,
  background: '#fff',
  color: '#1f2430',
  cursor: 'pointer',
  minWidth: 160
};

export default function PostList({
  posts,
  query,
  onQueryChange,
  loading,
  error,
  onCreate,
  onSelect
}) {
  const [newestFirst, setNewestFirst] = React.useState(true);
  const [location, setLocation] = React.useState('');
  const [studioType, setStudioType] = React.useState('');
  const [priceRange, setPriceRange] = React.useState('');

  const hasFilters = Boolean(location || studioType || priceRange);

  const sorted = React.useMemo(() => {
    const filtered = posts.filter(post => (!location || post.location === location) && (!studioType || post.studio_type === studioType) && inPriceRange(post.price_per_hour, priceRange));
    const list = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return newestFirst ? list : list.reverse();
  }, [posts, location, studioType, priceRange, newestFirst]);

  function clearAll() {
    onQueryChange('');
    setLocation('');
    setStudioType('');
    setPriceRange('');
  }

  const showClear = Boolean(query) || hasFilters;

  return <main className="wrap main-content">
    <div className="section-heading">
      <div>
        <div className="eyebrow muted">Alternative space</div>
        <h2>Latest offering<span className="accent-period">.</span></h2>
      </div>
      <button className="button button-outline new-post" onClick={onCreate}><Plus size={17} /> New listing</button>
    </div>
    <div className="toolbar">
      <div className="search-box">
        <Search size={18} />
        <input value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Search" aria-label="Search stories" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {showClear && <button className="button button-plain" onClick={clearAll}><X size={16} /> Clear all</button>}
        <button className="button button-plain" onClick={() => setNewestFirst(v => !v)}>
          <ArrowUpDown size={16} /> {newestFirst ? 'Newest first' : 'Oldest first'}
        </button>
        <span className="story-count">{sorted.length} {sorted.length === 1 ? 'story' : 'stories'}</span>
      </div>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '0 0 20px' }}>
      <select style={selectStyle} value={location} onChange={event => setLocation(event.target.value)} aria-label="Filter by location">
        <option value="">All locations</option>
        {LOCATIONS.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <select style={selectStyle} value={studioType} onChange={event => setStudioType(event.target.value)} aria-label="Filter by studio type">
        <option value="">All studio types</option>
        {STUDIO_TYPES.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <select style={selectStyle} value={priceRange} onChange={event => setPriceRange(event.target.value)} aria-label="Filter by price">
        <option value="">Any price</option>
        {PRICE_RANGES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </div>
    {error && <div className="notice error">
      {error}
    </div>}
    {loading ? <div className="empty"><LoaderCircle className="spin" /> Loading stories...</div> : sorted.length === 0 ? <div className="empty">
      <BookOpen size={34} />
      <h3>
        {showClear ? 'No matching stories' : 'The first page is yours to write'}
      </h3>
      <p>
        {showClear ? 'Try a different search or clear the filters.' : 'Create a post and start the conversation.'}
      </p>
      {showClear ? <button className="button button-outline" onClick={clearAll}>Clear all <X size={16} /></button> : <button className="button button-dark" onClick={onCreate}>Write a post <ArrowRight size={16} /></button>}
    </div> : <div className="post-grid">
      {sorted.map((post, index) => {
        const price = post.price_per_hour !== null && post.price_per_hour !== undefined ? `RM${Number(post.price_per_hour)} / hr` : '';
        const meta = [post.studio_type, post.location].filter(Boolean).join(' · ');
        return <button className="post-card" key={post.id} onClick={() => onSelect(post)}>
          <div className={`card-cover cover-${index % 4}`}>
            {post.image_url ? <img src={post.image_url} alt="" /> : <div className="cover-decoration">
              <span>✦</span>
              <span>✳</span>
            </div>}
          </div>
          <div className="card-content">
            <div className="card-date">
              {new Date(post.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <h3>
              {post.title}
            </h3>
            {meta && <div style={{ margin: '2px 0 8px', fontSize: 13, color: '#6b7280' }}>{meta}</div>}
            <p>
              {post.body}
            </p>
            <div className="card-bottom">
              <span>Have a look inside</span>
              <ArrowRight size={17} />
            </div>
          </div>
        </button>;
      })}
    </div>}
  </main>;
}
