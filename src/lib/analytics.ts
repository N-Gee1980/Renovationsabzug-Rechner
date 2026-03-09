import { supabase } from './supabase';

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analyticsSessionId', sessionId);
  }
  return sessionId;
}

export function initializeAnalytics() {
  const stored = localStorage.getItem('analyticsSessionId');
  if (stored) {
    sessionId = stored;
  } else {
    sessionId = getSessionId();
  }
}

export async function trackPageView(url: string, title?: string) {
  try {
    const sessionId = getSessionId();

    const { error } = await supabase.from('page_views').insert({
      session_id: sessionId,
      page_url: url,
      page_title: title || document.title,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    });

    if (error) console.error('Analytics error:', error);

    await updateSessionMetrics(sessionId);
  } catch (err) {
    console.error('Failed to track page view:', err);
  }
}

export async function trackInteraction(
  interactionType: string,
  elementId?: string,
  elementClass?: string,
  metadata?: Record<string, any>
) {
  try {
    const sessionId = getSessionId();

    const { error } = await supabase.from('user_interactions').insert({
      session_id: sessionId,
      interaction_type: interactionType,
      element_id: elementId || null,
      element_class: elementClass || null,
      page_url: window.location.pathname,
      metadata: metadata || null,
    });

    if (error) console.error('Analytics error:', error);
  } catch (err) {
    console.error('Failed to track interaction:', err);
  }
}

async function updateSessionMetrics(sessionId: string) {
  try {
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('analytics_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('analytics_sessions')
        .update({
          last_page_view: now,
          page_view_count: (existing.page_view_count || 1) + 1,
          updated_at: now,
        })
        .eq('session_id', sessionId);

      if (error) console.error('Analytics error:', error);
    } else {
      const { error } = await supabase.from('analytics_sessions').insert({
        session_id: sessionId,
        first_page_view: now,
        last_page_view: now,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      });

      if (error) console.error('Analytics error:', error);
    }
  } catch (err) {
    console.error('Failed to update session metrics:', err);
  }
}

export function getAnalyticsSessionId(): string {
  return getSessionId();
}
