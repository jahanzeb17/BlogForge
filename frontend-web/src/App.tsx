import React, { useState, useEffect } from 'react';
import { getToken, removeToken, listRuns, createRun, fetchRun, resumeRun, downloadFile, deleteRun } from './api';
import Auth from './components/Auth';
import { 
  Plus, FileText, Loader2, CheckCircle2, ChevronRight, Image as ImageIcon, 
  Download, LogOut, Search, PenTool, LayoutDashboard, FileArchive, Trash2, Edit3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AUDIENCES = [
  { id: 'general', label: 'General / Auto', desc: 'Let the AI decide' },
  { id: 'beginners', label: 'Beginners', desc: 'New learners' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Developers' },
  { id: 'experts', label: 'Experts', desc: 'Senior engineers' },
  { id: 'business', label: 'Business', desc: 'Non-technical readers' },
];

const TONES = [
  { id: 'auto', label: 'Auto', desc: 'Let the AI decide' },
  { id: 'professional', label: 'Professional', desc: 'Informative & clear' },
  { id: 'casual', label: 'Casual', desc: 'Conversational' },
  { id: 'tutorial', label: 'Tutorial', desc: 'Step-by-step' },
  { id: 'enthusiastic', label: 'Enthusiastic', desc: 'Engaging & energetic' },
];

const KINDS = [
  { id: 'auto', label: 'Auto', desc: 'Let the AI decide' },
  { id: 'explainer', label: 'Explainer', desc: 'Concept breakdown' },
  { id: 'tutorial', label: 'Tutorial', desc: 'How-to guide' },
  { id: 'news_roundup', label: 'News Roundup', desc: 'Recent updates' },
  { id: 'comparison', label: 'Comparison', desc: 'X vs Y' },
];

export default function App() {
  const [token, setToken] = useState(getToken());
  const [runs, setRuns] = useState<any[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<any>(null);

  useEffect(() => {
    if (token) loadRuns();
  }, [token]);

  useEffect(() => {
    let interval: any;
    if (activeRunId && token) {
      fetchCurrentRun();
      interval = setInterval(() => {
        if (runDetails?.status === 'pending' || runDetails?.status === 'running') {
          fetchCurrentRun();
        }
      }, 3000);
    } else {
      setRunDetails(null);
    }
    return () => clearInterval(interval);
  }, [activeRunId, runDetails?.status, token]);

  const loadRuns = async () => {
    try {
      const data = await listRuns();
      setRuns(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCurrentRun = async () => {
    try {
      const data = await fetchRun(activeRunId!);
      setRunDetails(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this run?')) return;
    try {
      await deleteRun(id);
      if (activeRunId === id) setActiveRunId(null);
      loadRuns();
    } catch (e) {
      console.error(e);
    }
  }

  if (!token) {
    return <Auth onLogin={() => setToken(getToken())} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-800">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-600 font-bold text-xl">
            <LayoutDashboard className="w-6 h-6" />
            BlogForge
          </div>
        </div>
        
        <div className="p-4">
          <button
            onClick={() => setActiveRunId(null)}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Blog
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Recent Runs</div>
          {runs.map((r) => (
            <div
              key={r.id}
              onClick={() => setActiveRunId(r.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                activeRunId === r.id ? 'bg-brand-50 border-brand-100 border' : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex flex-col overflow-hidden">
                <span className={`text-sm font-medium truncate ${activeRunId === r.id ? 'text-brand-700' : 'text-slate-700'}`}>
                  {r.topic || 'Untitled Run'}
                </span>
                <span className="text-xs text-slate-400 mt-1 capitalize flex items-center gap-1">
                  {r.status === 'pending' || r.status === 'running' ? (
                    <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  ) : r.status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : r.status === 'failed' ? (
                     <div className="w-2 h-2 rounded-full bg-red-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                  {r.status}
                </span>
              </div>
              <button 
                onClick={(e) => handleDelete(e, r.id)}
                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {runs.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-6 px-4">
              No blogs generated yet. Start your first one!
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => { removeToken(); setToken(null); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 w-full px-2 py-2 rounded-md hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative bg-slate-50/50">
        <div className="max-w-5xl mx-auto w-full p-8 pb-24">
          {!activeRunId ? (
            <NewRunForm onCreated={(id) => { setActiveRunId(id); loadRuns(); }} />
          ) : runDetails ? (
            <RunView run={runDetails} onUpdate={fetchCurrentRun} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Components ---

function NewRunForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [topic, setTopic] = useState('');
  const [asOf, setAsOf] = useState(new Date().toISOString().split('T')[0]);
  const [audience, setAudience] = useState('general');
  const [tone, setTone] = useState('auto');
  const [blogKind, setBlogKind] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await createRun({
        topic, as_of: asOf, 
        audience_pref: audience === 'general' ? null : audience,
        tone_pref: tone === 'auto' ? null : tone,
        blog_kind_pref: blogKind === 'auto' ? null : blogKind
      });
      onCreated(data.run_id);
    } catch (err: any) {
      setError(err.message || 'Failed to start run');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create New Blog</h1>
        <p className="mt-2 text-slate-500">Configure your topic and preferences below to kick off the AI pipeline.</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">{error}</div>}

      <form onSubmit={submit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-900">Topic or Prompt</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
            placeholder="E.g., A comprehensive guide to building microservices with FastAPI..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900">Target Audience</label>
            <div className="space-y-2">
              {AUDIENCES.map((a) => (
                <label key={a.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${audience === a.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="audience" value={a.id} checked={audience === a.id} onChange={(e) => setAudience(e.target.value)} className="sr-only" />
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${audience === a.id ? 'text-brand-900' : 'text-slate-700'}`}>{a.label}</span>
                    <span className="text-xs text-slate-500">{a.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-900">Tone</label>
              <select value={tone} onChange={e => setTone(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm">
                {TONES.map(t => <option key={t.id} value={t.id}>{t.label} - {t.desc}</option>)}
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-900">Blog Kind</label>
              <select value={blogKind} onChange={e => setBlogKind(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm">
                {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-900">As-of Date</label>
              <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button type="submit" disabled={loading || !topic.trim()} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Start Generation
          </button>
        </div>
      </form>
    </div>
  );
}

function RunView({ run, onUpdate }: { run: any, onUpdate: () => void }) {
  if (run.status === 'failed') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle2 className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Run Failed</h2>
          <div className="text-sm text-red-600/80 bg-red-100/50 p-4 rounded-xl text-left font-mono overflow-auto max-h-64 mt-6">
            {run.error_message || 'Unknown error occurred'}
          </div>
        </div>
      </div>
    );
  }

  if (run.status === 'completed') {
    return <FinishedView run={run} />;
  }

  if (run.status === 'interrupted') {
    if (run.interrupt_type === 'research_plan_review') {
      return <ReviewResearch run={run} onUpdate={onUpdate} />;
    }
    if (run.interrupt_type === 'final_draft_review') {
      return <ReviewDraft run={run} onUpdate={onUpdate} />;
    }
  }

  // Pending / Running
  return <LoadingTracker run={run} />;
}

function LoadingTracker({ run }: { run: any }) {
  const steps = [
    { label: 'Initializing & Routing', status: 'done' },
    { label: 'Drafting Research Plan', status: run.status === 'running' ? 'active' : 'pending' },
    { label: 'Executing Web Search', status: 'pending' },
    { label: 'Generating Sections', status: 'pending' },
    { label: 'Creating Final Draft', status: 'pending' },
  ];

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <h3 className="text-xl font-bold text-slate-900 mb-8 text-center">AI is working...</h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {steps.map((step, i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
              {step.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-brand-600" /> : 
               step.status === 'active' ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin" /> : 
               <div className="w-2 h-2 rounded-full bg-slate-300" />}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-slate-50 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className={`font-medium ${step.status === 'active' ? 'text-brand-700' : 'text-slate-700'}`}>{step.label}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewResearch({ run, onUpdate }: { run: any, onUpdate: () => void }) {
  const [queries, setQueries] = useState((run.interrupt_data?.queries || []).join('\n'));
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'approve' | 'edit' | 'skip_research') => {
    setLoading(true);
    try {
      const parsed = queries.split('\n').map(q => q.trim()).filter(q => q);
      await resumeRun(run.id, { 
        action: action === 'approve' && queries !== run.interrupt_data.queries.join('\n') ? 'edit' : action,
        queries: parsed
      });
      onUpdate();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-100 p-2 rounded-full">
            <Search className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-amber-900">Review Research Plan</h2>
        </div>
        <p className="text-amber-800 mb-6">The AI agent is preparing to search the web for evidence. Review and modify the search queries below, or skip research entirely if the topic is evergreen.</p>
        
        <div className="bg-white rounded-xl p-1 border border-amber-200 shadow-sm mb-6">
          <textarea
            value={queries}
            onChange={(e) => setQueries(e.target.value)}
            className="w-full p-4 border-0 focus:ring-0 text-slate-700 font-mono text-sm resize-none"
            rows={8}
            placeholder="Enter search queries, one per line..."
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-end border-t border-amber-200/50 pt-6">
          <button 
            disabled={loading}
            onClick={() => handleAction('skip_research')}
            className="px-6 py-2.5 rounded-xl font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors"
          >
            Skip Research
          </button>
          <button 
            disabled={loading}
            onClick={() => handleAction('approve')}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-medium text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Approve & Run Search
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewDraft({ run, onUpdate }: { run: any, onUpdate: () => void }) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom Markdown renderer to rewrite image paths
  const rewriteImagePath = (src: string) => {
    if (src.startsWith('http')) return src;
    const filename = src.split('/').pop();
    return `/api/runs/${run.id}/images/${filename}`;
  };

  const handleAction = async (action: 'approve' | 'revise') => {
    setLoading(true);
    try {
      await resumeRun(run.id, { action, instructions: feedback });
      onUpdate();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)] animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-brand-50 border border-brand-200 rounded-t-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-brand-100 p-2 rounded-full">
              <PenTool className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-brand-900">Review Final Draft</h2>
          </div>
          <p className="text-sm text-brand-700 ml-11">Review the compiled markdown. You can request changes to specific sections.</p>
        </div>
        <div className="flex gap-3 ml-11 md:ml-0">
           <button 
            disabled={loading}
            onClick={() => handleAction('approve')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-md transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Approve Draft
          </button>
        </div>
      </div>

      <div className="bg-white border-x border-brand-200 flex-1 overflow-y-auto p-8 lg:p-12 shadow-inner">
        <article className="prose prose-slate prose-brand max-w-none prose-headings:font-bold prose-a:text-brand-600 prose-img:rounded-xl prose-img:shadow-md">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({node, ...props}) => <img {...props} src={rewriteImagePath(props.src || '')} />
            }}
          >
            {run.interrupt_data?.final_md || ''}
          </ReactMarkdown>
        </article>
      </div>

      <div className="bg-slate-50 border border-brand-200 rounded-b-2xl p-6 shadow-sm shrink-0 border-t-0">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Request Revisions</label>
        <div className="flex gap-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none text-sm"
            rows={2}
            placeholder="E.g., In the Introduction section, make the tone more enthusiastic..."
          />
          <button 
            disabled={loading || !feedback.trim()}
            onClick={() => handleAction('revise')}
            className="px-6 py-2 rounded-xl font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50 h-fit self-end"
          >
            <Edit3 className="w-4 h-4 inline-block mr-2" />
            Revise
          </button>
        </div>
      </div>
    </div>
  );
}

function FinishedView({ run }: { run: any }) {
  const [activeTab, setActiveTab] = useState('preview');

  const rewriteImagePath = (src: string) => {
    if (src.startsWith('http')) return src;
    const filename = src.split('/').pop();
    return `/api/runs/${run.id}/images/${filename}`;
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
             <div className="bg-emerald-100 p-2 rounded-full">
               <CheckCircle2 className="w-6 h-6 text-emerald-600" />
             </div>
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Generation Complete</h1>
          </div>
          <p className="text-slate-500 mt-2 ml-12">Your blog post is ready for publishing.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => downloadFile('docx', run.final_markdown, run.plan?.blog_title)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm font-medium text-sm transition-colors">
             <FileText className="w-4 h-4 text-blue-600" /> Word (.docx)
          </button>
          <button onClick={() => downloadFile('pdf', run.final_markdown, run.plan?.blog_title)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm font-medium text-sm transition-colors">
             <FileArchive className="w-4 h-4 text-red-500" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-2 shrink-0 overflow-x-auto">
          {[
            { id: 'preview', icon: FileText, label: 'Preview' },
            { id: 'plan', icon: LayoutDashboard, label: 'Plan' },
            { id: 'evidence', icon: Search, label: 'Evidence' },
            { id: 'images', icon: ImageIcon, label: 'Images' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-brand-500 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'preview' && (
            <article className="max-w-3xl mx-auto prose prose-slate prose-brand prose-headings:font-bold prose-a:text-brand-600 prose-img:rounded-xl prose-img:shadow-md">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({node, ...props}) => <img {...props} src={rewriteImagePath(props.src || '')} />
                }}
              >
                {run.final_markdown || ''}
              </ReactMarkdown>
            </article>
          )}

          {activeTab === 'plan' && (
             <div className="max-w-4xl mx-auto">
               <pre className="bg-slate-900 text-slate-50 p-6 rounded-xl overflow-x-auto text-sm font-mono shadow-inner">
                 {JSON.stringify(run.plan, null, 2)}
               </pre>
             </div>
          )}

          {activeTab === 'evidence' && (
            <div className="max-w-5xl mx-auto grid gap-4">
              {(run.evidence || []).map((ev: any, i: number) => (
                <a key={i} href={ev.url} target="_blank" rel="noreferrer" className="block p-5 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-md transition-all group">
                  <h3 className="font-semibold text-brand-700 group-hover:text-brand-600 flex items-center gap-2 mb-2">
                    {ev.title} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                  </h3>
                  <div className="text-xs text-slate-400 mb-3 flex items-center gap-3">
                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-medium">{ev.source}</span>
                    <span>{ev.published_at}</span>
                    <span className="truncate max-w-xs">{ev.url}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-slate-200 pl-4 italic">"{ev.snippet}"</p>
                </a>
              ))}
              {(!run.evidence || run.evidence.length === 0) && (
                <div className="text-center py-12 text-slate-500">No evidence gathered (closed-book mode).</div>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
               {(run.images || []).map((img: any, i: number) => (
                 <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden group">
                   <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                     <img src={`/api/runs/${run.id}/images/${img.filename}`} alt={img.alt_text} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <a href={`/api/runs/${run.id}/images/${img.filename}`} download className="p-3 bg-white rounded-full shadow-lg text-slate-700 hover:text-brand-600 transform scale-90 group-hover:scale-100 transition-all">
                         <Download className="w-5 h-5" />
                       </a>
                     </div>
                   </div>
                   <div className="p-4 border-t border-slate-100 bg-slate-50">
                     <p className="text-sm font-medium text-slate-800 line-clamp-2">{img.alt_text}</p>
                     <p className="text-xs text-slate-500 mt-2 font-mono truncate">{img.filename}</p>
                   </div>
                 </div>
               ))}
               {(!run.images || run.images.length === 0) && (
                <div className="col-span-full text-center py-12 text-slate-500 flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
                  No images were generated for this post.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
