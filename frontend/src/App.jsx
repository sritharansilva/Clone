import React from 'react';
import { api } from './lib/api';
import { useSession } from './hooks/useSession';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import Editor from './components/Editor';
import Auth from './components/Auth';
import BookingModal from './components/BookingModal';
import BookingPage from './components/BookingPage';
import PricingPage from './components/PricingPage';
import BookingLookup from './BookingLookup';
import CancellationPolicy from './components/CancellationPolicy';
export default function App() {
  const session = useSession();
  const ADMIN_ID = 'c64f584e-9c61-43e4-91f3-518bd1f09b1d';
  const isAdmin = session?.user?.id === ADMIN_ID;
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [editor, setEditor] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [bookingPost, setBookingPost] = React.useState(null);
  const [bookingInitialDate, setBookingInitialDate] = React.useState('');
  const [bookingView, setBookingView] = React.useState(null);
  const [policyOpen, setPolicyOpen] = React.useState(false);
    function applyPage(page, data = null) {
    setPolicyOpen(page === 'policy');
    setBookingView(
      ['lookup', 'pricing', 'owner', 'customer'].includes(page)
        ? page
        : null
    );
    setSelected(page === 'detail' ? data : null);
  }

  function navigateTo(page, data = null) {
    window.history.pushState(
      { page, data },
      '',
      window.location.pathname + window.location.search
    );

    applyPage(page, data);
  }

  React.useEffect(() => {
    window.history.replaceState(
      { page: 'home' },
      '',
      window.location.pathname + window.location.search
    );

    function handlePopState(event) {
      const page = event.state?.page || 'home';
      applyPage(page, event.state?.data || null);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  async function refresh() {
    try {
      setPosts(await api('/posts'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => {
    refresh();
  }, []);
  const visible = posts.filter(p => `${p.title} ${p.body}`.toLowerCase().includes(query.toLowerCase()));
  const mine = post => session?.user?.id === post.author_id;
  const openCreate = () => session ? setEditor({}) : setAuthOpen(true);
  const openBooking = (post, date = '') => {
  setBookingPost(post);
  setBookingInitialDate(date);
};
  async function remove(post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    try {
      await api(`/posts/${post.id}`, {
        method: 'DELETE'
      });
      setSelected(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }
  return <div className="app">
   <Header
  session={session}
  onHome={() => navigateTo('home')}
  onExplore={() => navigateTo('home')}
  onSignIn={() => setAuthOpen(true)}
  onManageBookings={() => navigateTo('owner')}
  onMyBookings={() => navigateTo('customer')}
  onCheckBookingStatus={() => navigateTo('lookup')}
  onManagePricing={() => navigateTo('pricing')}
  isAdmin={isAdmin}
/>
{policyOpen ? (
  <CancellationPolicy
  onBack={() => window.history.back()}
/>
) : bookingView === 'lookup' ? (
  <BookingLookup
  onBack={() => window.history.back()}
/>
) : bookingView === 'pricing' ? (
  <PricingPage
    session={session}
    onBack={() => window.history.back()}
  />
) : bookingView ? (
  <BookingPage
    mode={bookingView}
    onBack={() => window.history.back()}
  />
) : selected ? <PostDetail

  post={selected}
  isOwner={mine(selected)}
  onBack={() => window.history.back()}
    onEdit={() => setEditor(selected)}
  onDelete={() => remove(selected)}
  onBook={() => openBooking(selected)}
/> : <>
      <Hero onCreate={openCreate}  />
      <PostList
  posts={visible}
  query={query}
  onQueryChange={setQuery}
  loading={loading}
  error={error}
  onCreate={openCreate}
  onSelect={post => navigateTo('detail', post)}
  onBook={openBooking}
/>
    </>}
    <Footer onPolicyClick={() => navigateTo('policy')} />

    {editor && <Editor post={editor.id ? editor : null} onClose={() => setEditor(null)} onSaved={async () => {
      setEditor(null);
      setSelected(null);
      await refresh();
    }} />}
    {authOpen && <Auth onClose={() => setAuthOpen(false)} />}
      {bookingPost && !policyOpen && (
  <BookingModal
    post={bookingPost}
    onClose={() => setBookingPost(null)}
    initialDate={bookingInitialDate}
    onPolicyClick={() => navigateTo('policy')}
  />
)}

  </div>;
}