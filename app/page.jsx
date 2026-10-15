'use client';

import { useEffect, useMemo, useState } from 'react';

const stages = ['New', 'Contacted', 'Tour booked', 'Joined', 'Closed lost'];
const owners = ['Alex Morgan', 'Sam Taylor'];
const sources = ['Website', 'Email', 'Phone', 'Walk-in'];
const initialForm = { fullName: '', email: '', subject: '', source: 'Website', owner: 'Alex Morgan', notes: '', nextFollowUpAt: '' };
const active = item => !['Joined', 'Closed lost'].includes(item.stage);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const prettyDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Not set';
const initials = name => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
const dueLabel = item => {
  if (!active(item) || !item.next_follow_up_at) return 'No follow-up';
  if (item.next_follow_up_at < today()) return `Overdue · ${prettyDate(item.next_follow_up_at)}`;
  if (item.next_follow_up_at === today()) return 'Due today';
  return `Due ${prettyDate(item.next_follow_up_at)}`;
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body;
}

function Glyph({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <><path d="M4 12h15M13 6l6 6-6 6"/></>,
    plus: <><path d="M12 4v16M4 12h16"/></>,
    close: <><path d="M5 5l14 14M19 5L5 19"/></>,
    filter: <><path d="M4 7h16M7 12h10M10 17h4"/></>,
    check: <><path d="M4 12l5 5L20 6"/></>,
    sparkle: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2ZM19 18l.6 1.4L21 20l-1.4.6L19 22l-.6-1.4L17 20l1.4-.6L19 18Z"/></>
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

export default function Home() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('All enquiries');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await requestJson('/api/enquiries');
    setEnquiries(data.enquiries);
    return data.enquiries;
  }
  async function openDetail(id) {
    setSelectedId(id);
    setError('');
    try {
      const data = await requestJson(`/api/enquiries/${id}`);
      setDetail(data);
      setDraft({ stage: data.enquiry.stage, owner: data.enquiry.owner, nextFollowUpAt: data.enquiry.next_follow_up_at || '' });
    } catch (cause) { setError(cause.message); }
  }
  useEffect(() => { refresh().catch(cause => setError(cause.message)).finally(() => setLoading(false)); }, []);

  const stats = useMemo(() => ({
    open: enquiries.filter(active).length,
    due: enquiries.filter(item => active(item) && item.next_follow_up_at === today()).length,
    overdue: enquiries.filter(item => active(item) && item.next_follow_up_at && item.next_follow_up_at < today()).length,
    joined: enquiries.filter(item => item.stage === 'Joined').length
  }), [enquiries]);
  const filtered = enquiries.filter(item => {
    const matchesText = `${item.full_name} ${item.email} ${item.subject}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesText) return false;
    if (filter === 'Follow-ups due') return active(item) && item.next_follow_up_at && item.next_follow_up_at <= today();
    return filter === 'All enquiries' || item.stage === filter;
  });
  const dueItems = enquiries.filter(item => active(item) && item.next_follow_up_at && item.next_follow_up_at <= today()).sort((a, b) => a.next_follow_up_at.localeCompare(b.next_follow_up_at));

  async function submitCreate(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await requestJson('/api/enquiries', { method: 'POST', body: JSON.stringify({ ...form, nextFollowUpAt: form.nextFollowUpAt || null }) });
      await refresh();
      setShowCreate(false); setForm(initialForm);
      setNotice('Enquiry added to the pipeline.');
      await openDetail(result.id);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  async function saveDetail(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      await requestJson(`/api/enquiries/${selectedId}`, { method: 'PATCH', body: JSON.stringify({ ...draft, nextFollowUpAt: draft.nextFollowUpAt || null }) });
      await refresh(); await openDetail(selectedId);
      setNotice('Enquiry updated.');
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  async function markFollowUp() {
    setBusy(true); setError(''); setNotice('');
    try {
      await requestJson(`/api/enquiries/${selectedId}/follow-up`, { method: 'POST', body: JSON.stringify({ nextFollowUpAt: draft.nextFollowUpAt || null }) });
      await refresh(); await openDetail(selectedId);
      setNotice('Follow-up recorded.');
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span/></div><div><strong>FAIRWAY</strong><small>DESK / PROTOTYPE</small></div></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <button className={filter === 'All enquiries' ? 'nav-item active' : 'nav-item'} onClick={() => setFilter('All enquiries')}><Glyph name="grid"/> Overview</button>
        <button className={stages.includes(filter) ? 'nav-item active' : 'nav-item'} onClick={() => setFilter('New')}><Glyph name="users"/> Enquiries <span className="nav-count">{stats.open}</span></button>
        <button className={filter === 'Follow-ups due' ? 'nav-item active' : 'nav-item'} onClick={() => setFilter('Follow-ups due')}><Glyph name="clock"/> Follow-ups <span className="nav-count accent">{stats.overdue + stats.due}</span></button>
      </nav>
      <div className="sidebar-spacer"/>
      <div className="demo-card"><Glyph name="sparkle"/><strong>Product thinking, in practice.</strong><p>A small local prototype using synthetic club enquiries. No customer data or live email.</p></div>
      <div className="profile-mini"><div className="avatar dark">DG</div><div><strong>Demo Golf Club</strong><small>Synthetic workspace</small></div><span>⌄</span></div>
    </aside>

    <main className="workspace">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>Membership enquiries</strong></div><div className="top-right"><span className="demo-pill"><span/> DEMO DATA</span><div className="avatar">GM</div></div></header>
      <div className="content">
        <div className="page-intro"><div><div className="eyebrow">MEMBERSHIP OPERATIONS <span>·</span> 01 / 04</div><h1>Every enquiry<br/><em>has a next step.</em></h1><p>Keep member conversations moving, from first question to joining the club.</p></div><button className="button primary" onClick={() => { setShowCreate(true); setError(''); setForm({ ...initialForm, nextFollowUpAt: tomorrow() }); }}><Glyph name="plus" size={17}/> New enquiry</button></div>

        {error && <div className="alert error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
        {notice && <div className="alert success" role="status">{notice}<button aria-label="Dismiss notice" onClick={() => setNotice('')}>×</button></div>}

        <section className="stats" aria-label="Pipeline snapshot">
          <div className="stat"><span>OPEN ENQUIRIES</span><strong>{stats.open}</strong><small>Active membership conversations</small></div>
          <div className="stat"><span>DUE TODAY</span><strong>{stats.due}</strong><small>Follow-ups scheduled for today</small></div>
          <div className="stat warning"><span>NEEDS ATTENTION</span><strong>{stats.overdue}</strong><small>Follow-ups past their due date</small></div>
          <div className="stat"><span>JOINED</span><strong>{stats.joined}</strong><small>Memberships marked complete</small></div>
        </section>

        <div className="main-grid">
          <section className="panel pipeline"><div className="panel-heading"><div><div className="eyebrow">THE PIPELINE</div><h2>Membership enquiries</h2></div><span className="count-chip">{filtered.length} shown</span></div>
            <div className="filter-row"><div className="search-box"><span>⌕</span><input aria-label="Search enquiries" placeholder="Search by name or enquiry..." value={search} onChange={event => setSearch(event.target.value)}/></div><div className="select-wrap"><Glyph name="filter" size={16}/><select aria-label="Filter enquiries" value={filter} onChange={event => setFilter(event.target.value)}><option>All enquiries</option><option>Follow-ups due</option>{stages.map(stage => <option key={stage}>{stage}</option>)}</select></div></div>
            <div className="table-scroll"><table><thead><tr><th>CONTACT</th><th>ENQUIRY</th><th>STAGE</th><th>FOLLOW-UP</th><th></th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className="empty-row">Loading enquiries…</td></tr> : filtered.length === 0 ? <tr><td colSpan="5" className="empty-row">No enquiries match this view.</td></tr> : filtered.map(item => <tr key={item.id} onClick={() => openDetail(item.id)}><td><div className="contact-cell"><div className="avatar contact-avatar">{initials(item.full_name)}</div><div><strong>{item.full_name}</strong><small>{item.email}</small></div></div></td><td><strong className="subject">{item.subject}</strong><small className="source">{item.source} · {item.owner}</small></td><td><span className={`stage stage-${item.stage.toLowerCase().replaceAll(' ', '-')}`}>{item.stage}</span></td><td><span className={item.next_follow_up_at && active(item) && item.next_follow_up_at < today() ? 'due overdue' : 'due'}>{dueLabel(item)}</span></td><td className="row-arrow">→</td></tr>)}</tbody></table></div>
            <div className="panel-footer">A clear owner and next action for every open conversation <span>↗</span></div>
          </section>

          <aside className="right-column"><section className="panel attention"><div className="panel-heading"><div><div className="eyebrow">YOUR PRIORITIES</div><h2>Follow-ups due</h2></div><div className="attention-icon"><Glyph name="clock" size={19}/></div></div><p className="panel-subtitle">A short list of conversations that need a response.</p>{dueItems.length ? <div className="due-list">{dueItems.slice(0, 5).map(item => <button key={item.id} onClick={() => openDetail(item.id)}><span className="due-dot"/><span><strong>{item.full_name}</strong><small>{item.subject}</small></span><em>{item.next_follow_up_at < today() ? 'OVERDUE' : 'TODAY'}</em></button>)}</div> : <div className="nothing-due"><Glyph name="check"/><p>All caught up for now.</p></div>}<button className="text-link" onClick={() => setFilter('Follow-ups due')}>View due follow-ups <Glyph name="arrow" size={16}/></button></section>
          <section className="insight-card"><div className="insight-top"><span>THE PRODUCT QUESTION</span><span>✳</span></div><h3>What gets lost between inbox and joining?</h3><p>This prototype makes the answer visible: enquiry, owner, stage and next follow-up in one place.</p><div className="insight-bottom"><span>Built to test a workflow</span><span>↗</span></div></section></aside>
        </div>
        <footer className="workspace-footer">FAIRWAY DESK <span>·</span> Membership CRM concept <span>·</span> Synthetic data only</footer>
      </div>
    </main>

    {showCreate && <div className="overlay" onClick={() => setShowCreate(false)}><section className="drawer" role="dialog" aria-modal="true" aria-label="New membership enquiry" onClick={event => event.stopPropagation()}><div className="drawer-header"><div><div className="eyebrow">NEW RECORD</div><h2>Membership enquiry</h2></div><button className="icon-button" aria-label="Close form" onClick={() => setShowCreate(false)}><Glyph name="close"/></button></div><p className="drawer-intro">Capture the person, the question and who will follow up.</p><form onSubmit={submitCreate} className="form-stack"><label>Contact name<input required minLength="2" maxLength="100" value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} placeholder="e.g. Jordan Smith"/></label><label>Email address<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="jordan@example.com"/></label><label>Enquiry subject<input required minLength="3" maxLength="120" value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} placeholder="e.g. Individual membership"/></label><div className="field-pair"><label>Source<select value={form.source} onChange={event => setForm({ ...form, source: event.target.value })}>{sources.map(source => <option key={source}>{source}</option>)}</select></label><label>Owner<select value={form.owner} onChange={event => setForm({ ...form, owner: event.target.value })}>{owners.map(owner => <option key={owner}>{owner}</option>)}</select></label></div><label>Next follow-up<input type="date" value={form.nextFollowUpAt} onChange={event => setForm({ ...form, nextFollowUpAt: event.target.value })}/></label><label>Context for the team<textarea maxLength="1000" rows="4" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="What is the prospective member looking for?"/></label><div className="drawer-actions"><button type="button" className="button secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="button primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add enquiry'} <Glyph name="arrow" size={16}/></button></div></form></section></div>}

    {selectedId && detail && <div className="overlay" onClick={() => { setSelectedId(null); setDetail(null); }}><section className="drawer detail-drawer" role="dialog" aria-modal="true" aria-label="Enquiry details" onClick={event => event.stopPropagation()}><div className="drawer-header"><div><div className="eyebrow">MEMBERSHIP ENQUIRY</div><h2>{detail.enquiry.full_name}</h2></div><button className="icon-button" aria-label="Close details" onClick={() => { setSelectedId(null); setDetail(null); }}><Glyph name="close"/></button></div><p className="drawer-intro">{detail.enquiry.subject} <span>·</span> {detail.enquiry.source}</p><div className="contact-band"><span className="avatar contact-avatar">{initials(detail.enquiry.full_name)}</span><div><strong>{detail.enquiry.full_name}</strong><small>{detail.enquiry.email}</small></div></div><form onSubmit={saveDetail} className="form-stack"><div className="field-pair"><label>Stage<select value={draft?.stage || ''} onChange={event => setDraft({ ...draft, stage: event.target.value })}>{stages.map(stage => <option key={stage}>{stage}</option>)}</select></label><label>Owner<select value={draft?.owner || ''} onChange={event => setDraft({ ...draft, owner: event.target.value })}>{owners.map(owner => <option key={owner}>{owner}</option>)}</select></label></div><label>Next follow-up<input type="date" value={draft?.nextFollowUpAt || ''} onChange={event => setDraft({ ...draft, nextFollowUpAt: event.target.value })}/></label><div className="drawer-actions"><button className="button secondary" type="button" onClick={markFollowUp} disabled={busy}><Glyph name="check" size={16}/> Record follow-up</button><button className="button primary" type="submit" disabled={busy}>Save changes</button></div></form><div className="detail-section"><h3>Team context</h3><p>{detail.enquiry.notes || 'No notes yet.'}</p></div><div className="detail-section"><h3>Activity</h3><div className="activity-list">{detail.activity.map(item => <div key={item.id}><span className="activity-dot"/><div><strong>{item.detail}</strong><small>{new Date(item.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></div></div>)}</div></div></section></div>}
  </div>;
}
