
import React from 'react';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth({ onClose }) {
  const [mode, setMode] = React.useState('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    const {
      data,
      error: authError
    } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setBusy(false);

    if (authError) return setError(authError.message);

    if (data.session) {
      onClose();
    } else {
      setMessage('Check your email for a confirmation link, then sign in.');
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal auth-modal auth-modal-new">

        <button
          className="icon-button auth-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={21} />
        </button>

        <div className="auth-new-icon">
          <Sparkles size={23} />
        </div>

        <div className="auth-new-brand">StudioS</div>

        <div className="auth-new-eyebrow">
          {mode === 'signin' ? 'WELCOME BACK' : 'JOIN OUR COMMUNITY'}
        </div>

        <h2>
          {mode === 'signin'
            ? 'Good to see you again.'
            : 'Make space for something great.'}
        </h2>

        <p className="auth-new-description">
          {mode === 'signin'
            ? 'Sign in to continue exploring and managing your studio experience.'
            : 'Create your StudioS account and discover spaces made for creativity.'}
        </p>

        <form onSubmit={submit} className="auth-new-form">

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {error && (
            <div className="notice error">{error}</div>
          )}

          {message && (
            <div className="notice success">{message}</div>
          )}

          <button
            className="button button-dark auth-submit auth-new-submit"
            disabled={busy}
          >
            {busy
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign in to StudioS'
                : 'Create my account'}
            <ArrowRight size={17} />
          </button>

        </form>

        <div className="auth-new-switch">
          {mode === 'signin'
            ? 'New to StudioS?'
            : 'Already have an account?'}

          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setMessage('');
            }}
          >
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </button>
        </div>

        <div className="auth-new-footer">
          A space for every creative idea.
        </div>

      </div>
    </div>
  );
}
