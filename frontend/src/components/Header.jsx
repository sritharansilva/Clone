
import React from 'react';
import {
  ArrowRight,
  LogOut,
  CalendarDays,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Header({
  session,
  onHome,
  onExplore,
  onSignIn,
  onManageBookings,
  onMyBookings,
  onCheckBookingStatus,
  onManagePricing,
  isAdmin
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#home" onClick={onHome}>
  <span className="brand-word">Studio</span><span className="brand-s">S</span>
</a>
{/* explore space */}
        <nav className="header-actions">
          <button className="nav-link" onClick={onExplore}>
            
          </button>
          <button className="nav-link" onClick={onCheckBookingStatus}>
            Check Booking Status
          </button>

          
{session && (
  <>
    <button className="nav-link" onClick={onManageBookings}>
      <ClipboardList size={15} /> Manage Bookings
    </button>

    <button className="nav-link" onClick={onMyBookings}>
      <CalendarDays size={15} /> My Bookings
    </button>

    <button className="nav-link" onClick={onManagePricing}>
      Manage Pricing
    </button>
  </>
)}


          
          {session ? (
            <>
              <button className="avatar" title={session.user.email}>
                {session.user.email?.slice(0, 1).toUpperCase()}
              </button>

              <button
                className="icon-button logout"
                title="Sign out"
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              className="button button-small button-outline"
              onClick={onSignIn}
            >
              Sign in <ArrowRight size={15} />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
