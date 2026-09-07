'use client';

import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Compass,
  Dumbbell,
  Eye,
  EyeOff,
  ExternalLink,
  Flame,
  Grip,
  Info,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Match = {
  id: string;
  outcome: 'win' | 'loss' | 'draw' | 'no_contest';
  win_method: string | null;
  opponent_name: string | null;
  result_detail: string | null;
  points_for: number | null;
  points_against: number | null;
  duration_seconds: number | null;
  notes: string | null;
  sequence_no: number;
};
type CompetitionMedia = {
  id: string;
  competition_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  caption: string | null;
};
type Competition = {
  id: string;
  name: string;
  starts_on: string;
  city: string | null;
  division: string | null;
  weight_class: string | null;
  ruleset: string | null;
  source_url: string | null;
  cover_image_url: string | null;
  medal: 'gold' | 'silver' | 'bronze' | null;
  placement: number | null;
  overall_score: number | null;
  notes: string | null;
  debrief_focus: string | null;
  matches: Match[] | null;
  competition_media: CompetitionMedia[] | null;
};
type Profile = { display_name: string; belt_rank: string | null };
type Athlete = { id: string; username: string; displayName: string; createdAt: string };
type Page = 'overview' | 'competitions' | 'training' | 'regulations' | 'athletes';
type TrainingSession = { id: string; trained_on: string; duration_minutes: number | null; intensity: number | null; focus: string | null; notes: string | null };

const accents = ['gold', 'violet', 'coral'];
const medals = { gold: '🥇 Or', silver: '🥈 Argent', bronze: '🥉 Bronze' };
const regulations = [
  {
    name: 'FFLDA',
    full: 'Fédération Française de Lutte et Disciplines Associées',
    discipline: 'Grappling Gi & No-Gi',
    role: 'Fédération délégataire pour le grappling',
    tone: 'green',
    source: 'Comité Français de Grappling · règles 2026',
    url: 'https://www.grappling-france.com/reglement/',
    items: [
      'Règlement sportif officiel applicable aux compétitions sous convention ou délégation FFLDA / France Grappling.',
      'Règles UWW : référence internationale pour le grappling, le grappling Gi et l’arbitrage.',
      'Licence obligatoire ; inscriptions closes cinq jours avant l’épreuve.',
      'Pesée juste avant le premier combat : dépassement de poids = disqualification.',
    ],
  },
  {
    name: 'France Judo',
    full: 'FFJDA · France Jujitsu',
    discipline: 'JJB Gi · Jujitsu / Ne-Waza',
    role: 'Circuit national et championnats de France JJB',
    tone: 'blue',
    source: 'Textes officiels 2025/2026',
    url: 'https://www.ffjudo.com/textes-officiels',
    items: [
      'Le circuit Open France Jujitsu JJB applique le règlement IBJJF, adapté aux âges et ceintures.',
      'Format Open 2026 : Gi réglementaire blanc, bleu ou noir ; combats de 5 minutes.',
      'Égalité : avantages, pénalités, puis décision arbitrale selon les critères IBJJF.',
      'Pesée le jour même, une heure avant la catégorie, sans tolérance de poids.',
    ],
  },
  {
    name: 'CFJJB',
    full: 'Confédération Française de Jiu-Jitsu Brésilien',
    discipline: 'JJB Gi & No-Gi',
    role: 'Structure spécialisée JJB · non délégataire',
    tone: 'orange',
    source: 'Règlement officiel CFJJB 2026',
    url: 'https://cfjjb.com/docs/reglement2025/Reglement%20CFJJB%202026%20v1%2017-11-2025.pdf',
    items: [
      'Règlement officiel 2026 avec les règles de compétition Gi et No-Gi.',
      'Licence CFJJB de saison obligatoire dans les clubs affiliés ; elle emporte acceptation des règlements.',
      'Le règlement interne couvre également licences, tenues, ranking, sélection nationale et sponsors.',
      'Le règlement médical et les documents d’affiliation sont publiés par la CFJJB.',
    ],
  },
];

function ScoreRing({ value }: { value: number | null }) {
  const score = value ?? 0;
  return (
    <div
      className="score-ring"
      style={{ '--score': `${score * 10}%` } as React.CSSProperties}
    >
      <span>{score ? score.toFixed(1) : '—'}</span>
      <small>/10</small>
    </div>
  );
}

function Regulations() {
  return (
    <>
      <span className="eyebrow">
        <span />
        RÉFÉRENTIEL COMPÉTITION
      </span>
      <h1>
        Les règles du jeu,
        <br />
        <em>sans approximation.</em>
      </h1>
      <p className="intro">
        Les points clés et les documents à consulter avant ton inscription. Les
        liens mènent directement vers les publications des structures
        concernées.
      </p>
      <div className="regulation-note">
        <Info size={19} />
        <p>
          Le règlement de l’organisateur de ton épreuve prévaut toujours.
          Vérifie la version indiquée sur la page de l’événement.
        </p>
      </div>
      <section className="regulations-grid">
        {regulations.map((r) => (
          <article className={`regulation-card ${r.tone}`} key={r.name}>
            <div className="regulation-content">
              <div className="regulation-heading">
                <div>
                  <span className="regulation-discipline">{r.discipline}</span>
                  <h2>{r.name}</h2>
                  <p>{r.full}</p>
                </div>
                <span className={`status-pill ${r.tone}`}>
                  <ShieldCheck size={13} />
                  {r.role}
                </span>
              </div>
              <ul>
                {r.items.map((item) => (
                  <li key={item}>
                    <Check size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                className="regulation-link"
                href={r.url}
                target="_blank"
                rel="noreferrer"
              >
                <BookOpen size={16} />
                {r.source}
                <ExternalLink size={15} />
              </a>
            </div>
          </article>
        ))}
      </section>
      <p className="regulations-updated">
        Sources consultées le 7 septembre 2026 · Les règles peuvent évoluer en
        cours de saison.
      </p>
    </>
  );
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [athleteName, setAthleteName] = useState('');
  const [athleteUsername, setAthleteUsername] = useState('');
  const [athletePin, setAthletePin] = useState('');
  const [creatingAthlete, setCreatingAthlete] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [panel, setPanel] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [debriefFor, setDebriefFor] = useState<Competition | null>(null);
  const [eventDetails, setEventDetails] = useState<Competition | null>(null);
  const [savingDebrief, setSavingDebrief] = useState(false);
  const [debriefStep, setDebriefStep] = useState<1 | 2 | 3>(1);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState<Page>('overview');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [trainingPanel, setTrainingPanel] = useState(false);
  const [trainingDate, setTrainingDate] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingTraining, setEditingTraining] = useState<TrainingSession | null>(null);
  const [savingTraining, setSavingTraining] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftStartsOn, setDraftStartsOn] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [draftCity, setDraftCity] = useState('');
  const [resetFor, setResetFor] = useState<Athlete | null>(null);
  const [resetPin, setResetPin] = useState('');
  const [resettingPin, setResettingPin] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [deletingCompetitionId, setDeletingCompetitionId] = useState<string | null>(null);
  const [competitionPendingDeletion, setCompetitionPendingDeletion] = useState<Competition | null>(null);
  const [debriefDraft, setDebriefDraft] = useState({ wins: '0', losses: '0', draws: '0', score: '', notes: '', focus: '' });
  const load = useCallback(async (user: User) => {
    setLoading(true);
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name:
        (typeof user.user_metadata.display_name === 'string' &&
          user.user_metadata.display_name) ||
        user.email?.split('@')[0] ||
        'Athlète',
      username:
        typeof user.user_metadata.username === 'string'
          ? user.user_metadata.username
          : null,
      updated_at: new Date().toISOString(),
    });
    const [profileResult, initialCompetitionResult, trainingResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,display_name,belt_rank')
        .eq('id', user.id)
        .single(),
      supabase
        .from('competitions')
        .select(
          'id,name,starts_on,city,division,weight_class,ruleset,source_url,cover_image_url,medal,placement,overall_score,notes,debrief_focus,matches(id,outcome,win_method,opponent_name,result_detail,points_for,points_against,duration_seconds,notes,sequence_no)',
        )
        .order('starts_on', { ascending: false }),
      supabase.from('training_sessions').select('id,trained_on,duration_minutes,intensity,focus,notes').eq('owner_id', user.id).order('trained_on', { ascending: false }),
    ]);
    let competitionResult = initialCompetitionResult;
    // Keep the season readable while a database deployment is catching up with
    // the optional debrief column introduced alongside competition media.
    if (competitionResult.error?.message.includes('debrief_focus')) {
      competitionResult = await supabase
        .from('competitions')
        .select(
          'id,name,starts_on,city,division,weight_class,ruleset,source_url,cover_image_url,medal,placement,overall_score,notes,matches(id,outcome,win_method,opponent_name,result_detail,points_for,points_against,duration_seconds,notes,sequence_no)',
        )
        .order('starts_on', { ascending: false });
    }
    if (profileResult.data) setProfile(profileResult.data);
    if (competitionResult.error) setNotice(competitionResult.error.message);
    const baseCompetitions = (competitionResult.data as Omit<Competition, 'competition_media'>[] | null) ?? [];
    const competitionIds = baseCompetitions.map((competition) => competition.id);
    const mediaResult = competitionIds.length
      ? await supabase
          .from('competition_media')
          .select('id,competition_id,storage_path,media_type,caption')
          .in('competition_id', competitionIds)
      : { data: [] as CompetitionMedia[], error: null };
    // Media is an optional enhancement for existing deployments. Do not hide
    // the competition history when its table has not reached the API yet.
    if (mediaResult.error && !mediaResult.error.message.includes('competition_media')) {
      setNotice(mediaResult.error.message);
    }
    const mediaByCompetition = new Map<string, CompetitionMedia[]>();
    for (const media of (mediaResult.data as CompetitionMedia[] | null) ?? []) {
      const collection = mediaByCompetition.get(media.competition_id) ?? [];
      collection.push(media);
      mediaByCompetition.set(media.competition_id, collection);
    }
    const loadedCompetitions: Competition[] = baseCompetitions.map((competition) => ({
      ...competition,
      competition_media: mediaByCompetition.get(competition.id) ?? [],
    }));
    setCompetitions(loadedCompetitions);
    const media = loadedCompetitions.flatMap((competition) => competition.competition_media ?? []);
    const signedMedia = await Promise.all(media.map(async (item) => {
      const { data } = await supabase.storage.from('competition-media').createSignedUrl(item.storage_path, 60 * 60);
      return [item.id, data?.signedUrl] as const;
    }));
    setMediaUrls(Object.fromEntries(signedMedia.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))));
    setTrainingSessions((trainingResult.data as TrainingSession[] | null) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void load(data.session.user);
      else setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) void load(next.user);
      else {
        setProfile(null);
        setCompetitions([]);
        setMediaUrls({});
        setLoading(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [load]);
  useEffect(() => {
    if (!panel && !debriefFor && !eventDetails && !confirmLogout && !trainingPanel) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [panel, debriefFor, eventDetails, confirmLogout, trainingPanel]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);
  useEffect(() => {
    const saved = window.localStorage.getItem('rollbook-page') as Page | null;
    if (saved && ['overview', 'competitions', 'training', 'regulations', 'athletes'].includes(saved)) setPage(saved);
  }, []);
  useEffect(() => { window.localStorage.setItem('rollbook-page', page); }, [page]);
  useEffect(() => {
    if (!('Notification' in window)) {
      setBrowserNotificationPermission('unsupported');
      return;
    }
    setBrowserNotificationPermission(Notification.permission);
  }, []);
  useEffect(() => {
    if (!panel) setModalStep(1);
  }, [panel]);
  useEffect(() => {
    if (!debriefFor) return;
    setDebriefDraft({
      wins: String(debriefFor.matches?.filter((match) => match.outcome === 'win').length ?? 0),
      losses: String(debriefFor.matches?.filter((match) => match.outcome === 'loss').length ?? 0),
      draws: String(debriefFor.matches?.filter((match) => match.outcome === 'draw').length ?? 0),
      score: debriefFor.overall_score?.toString() ?? '',
      notes: debriefFor.notes ?? '',
      focus: debriefFor.debrief_focus ?? '',
    });
  }, [debriefFor]);
  useEffect(() => {
    const interval = window.setInterval(() => setCountdownNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);
  const totals = useMemo(() => {
    const matches = competitions.flatMap(
      (competition) => competition.matches ?? [],
    );
    const wins = matches.filter((item) => item.outcome === 'win').length;
    const losses = matches.filter((item) => item.outcome === 'loss').length;
    const submissions = matches.filter(
      (item) => item.outcome === 'win' && item.win_method === 'submission',
    ).length;
    const scores = competitions
      .map((item) => item.overall_score)
      .filter((value): value is number => value !== null);
    return {
      matches: matches.length,
      wins,
      losses,
      submissions,
      score: scores.length
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null,
    };
  }, [competitions]);
  async function authenticate(event: FormEvent) {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      setNotice('Identifiant invalide.');
      return;
    }
    setAuthLoading(true);
    setNotice('');
    const { error } = await supabase.auth.signInWithPassword({
      email: `${normalizedUsername}@rollbook.local`,
      password,
    });
    setAuthLoading(false);
    if (error) {
      setNotice(error.message);
      return;
    }
  }
  async function importEvent() {
    if (!sourceUrl.trim()) return;
    setImporting(true);
    setNotice('');
    try {
      const response = await fetch(
        `/api/import-event?url=${encodeURIComponent(sourceUrl)}`,
      );
      const data = (await response.json()) as {
        name?: string;
        image?: string;
        city?: string;
        startsOn?: string;
        sourceUrl?: string;
        error?: string;
      };
      if (!response.ok) {
        setNotice(data.error ?? 'Import impossible.');
        return;
      }
      setDraftName(data.name ?? '');
      setDraftStartsOn(data.startsOn ?? '');
      setCoverImageUrl(data.image ?? '');
      setDraftCity(data.city ?? '');
      setSourceUrl(data.sourceUrl ?? sourceUrl);
    } catch {
      setNotice('Import impossible. Vérifie ton lien et réessaie.');
    } finally {
      setImporting(false);
    }
  }
  async function createAthlete(event: FormEvent) {
    event.preventDefault();
    const token = session?.access_token;
    if (!token) return;
    setCreatingAthlete(true);
    setNotice('');
    const response = await fetch('/api/admin/athletes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ displayName: athleteName, username: athleteUsername, pin: athletePin }),
    });
    const data = (await response.json()) as { id?: string; error?: string };
    setCreatingAthlete(false);
    if (!response.ok) return setNotice(data.error ?? 'Création impossible.');
    setAthleteName(''); setAthleteUsername(''); setAthletePin('');
    setNotice('Accès créé. Transmets l’identifiant et le code PIN à l’athlète.');
    setAthletes((items) => [...items, { id: data.id ?? crypto.randomUUID(), username: athleteUsername, displayName: athleteName, createdAt: new Date().toISOString() }]);
  }
  async function deleteAthlete(athlete: { id: string; displayName: string }) {
    if (!session || !window.confirm(`Supprimer définitivement l’accès de ${athlete.displayName} ? Ses données seront également supprimées.`)) return;
    const response = await fetch('/api/admin/athletes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id: athlete.id }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) return setNotice(data.error ?? 'Suppression impossible.');
    setAthletes((items) => items.filter((item) => item.id !== athlete.id));
    setNotice(`Accès de ${athlete.displayName} supprimé.`);
  }
  async function resetAthletePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !resetFor || !/^\d{6}$/.test(resetPin)) return;
    setResettingPin(true);
    setNotice('');
    const response = await fetch('/api/admin/athletes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id: resetFor.id, pin: resetPin }),
    });
    const data = (await response.json()) as { error?: string };
    setResettingPin(false);
    if (!response.ok) return setNotice(data.error ?? 'Réinitialisation impossible.');
    setNotice(`PIN réinitialisé pour ${resetFor.displayName}. Transmets-le maintenant : il ne sera pas conservé ici.`);
    setResetFor(null);
    setResetPin('');
  }
  useEffect(() => {
    if (!session || session.user.email?.toLowerCase() !== import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase()) return;
    void fetch('/api/admin/athletes', { headers: { Authorization: `Bearer ${session.access_token}` } }).then(async (response) => response.ok && setAthletes(await response.json()));
  }, [session]);
  async function addCompetition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setNotice('');
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from('competitions').insert({
      owner_id: session.user.id,
      name: draftName.trim(),
      starts_on: draftStartsOn,
      city: draftCity.trim() || null,
      division: String(form.get('division')) || null,
      weight_class: String(form.get('weight_class')) || null,
      ruleset: String(form.get('ruleset')) || null,
      notes: String(form.get('notes')) || null,
      source_url: sourceUrl || null,
      cover_image_url: coverImageUrl || null,
    });
    setSaving(false);
    if (error) {
      setNotice(error.message);
      return;
    }
    setPanel(false);
    setSourceUrl('');
    setDraftName('');
    setDraftStartsOn('');
    setCoverImageUrl('');
    setDraftCity('');
    await load(session.user);
  }
  async function saveDebrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !debriefFor) return;
    const form = new FormData(event.currentTarget);
    const wins = Number(debriefDraft.wins || 0);
    const losses = Number(debriefDraft.losses || 0);
    const draws = Number(debriefDraft.draws || 0);
    const { score, notes, focus } = debriefDraft;
    const files = form.getAll('media').filter((item): item is File => item instanceof File && item.size > 0);
    setSavingDebrief(true);
    const existingMatches = debriefFor.matches ?? [];
    const existingWins = existingMatches.filter((match) => match.outcome === 'win').length;
    const existingLosses = existingMatches.filter((match) => match.outcome === 'loss').length;
    const existingDraws = existingMatches.filter((match) => match.outcome === 'draw').length;
    const newWins = Math.max(0, wins - existingWins);
    const newLosses = Math.max(0, losses - existingLosses);
    const newDraws = Math.max(0, draws - existingDraws);
    const offset = existingMatches.length;
    const matches = [
      ...Array.from({ length: newWins }, (_, index) => ({ owner_id: session.user.id, competition_id: debriefFor.id, sequence_no: offset + index + 1, outcome: 'win' })),
      ...Array.from({ length: newLosses }, (_, index) => ({ owner_id: session.user.id, competition_id: debriefFor.id, sequence_no: offset + newWins + index + 1, outcome: 'loss' })),
      ...Array.from({ length: newDraws }, (_, index) => ({ owner_id: session.user.id, competition_id: debriefFor.id, sequence_no: offset + newWins + newLosses + index + 1, outcome: 'draw' })),
    ];
    const { error } = matches.length ? await supabase.from('matches').insert(matches) : { error: null };
    if (!error) {
      const { error: competitionError } = await supabase.from('competitions').update({ notes: notes || null, debrief_focus: focus || null, overall_score: score ? Number(score) : null }).eq('id', debriefFor.id);
      if (competitionError) {
        setSavingDebrief(false);
        return setNotice(competitionError.message);
      }
      let uploaded: Array<{ owner_id: string; competition_id: string; storage_path: string; media_type: 'image' | 'video' }> = [];
      try {
        uploaded = await Promise.all(files.map(async (file) => {
          const path = `${session.user.id}/${debriefFor.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
          const { error: uploadError } = await supabase.storage.from('competition-media').upload(path, file, { contentType: file.type, upsert: false });
          if (uploadError) throw uploadError;
          return { owner_id: session.user.id, competition_id: debriefFor.id, storage_path: path, media_type: file.type.startsWith('video/') ? 'video' as const : 'image' as const };
        }));
      } catch (uploadError) {
        setSavingDebrief(false);
        return setNotice(uploadError instanceof Error ? uploadError.message : 'Import du média impossible.');
      }
      if (uploaded.length) {
        const { error: mediaError } = await supabase.from('competition_media').insert(uploaded);
        if (mediaError) {
          setSavingDebrief(false);
          return setNotice(mediaError.message);
        }
      }
    }
    setSavingDebrief(false);
    if (error) return setNotice(error.message);
    setDebriefFor(null);
    await load(session.user);
  }
  async function addTrainingSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const form = new FormData(event.currentTarget);
    setSavingTraining(true);
    setNotice('');
    const payload = {
      owner_id: session.user.id,
      trained_on: trainingDate,
      duration_minutes: Number(form.get('duration_minutes')),
      intensity: Number(form.get('intensity')),
      focus: String(form.get('focus')).trim() || null,
      notes: String(form.get('notes')).trim() || null,
    };
    const { error } = editingTraining
      ? await supabase.from('training_sessions').update(payload).eq('id', editingTraining.id)
      : await supabase.from('training_sessions').insert(payload);
    setSavingTraining(false);
    if (error) return setNotice(error.message);
    setTrainingPanel(false);
    setEditingTraining(null);
    await load(session.user);
  }
  async function deleteTrainingSession(id: string) {
    if (!session) return;
    const { error } = await supabase.from('training_sessions').delete().eq('id', id);
    if (error) return setNotice(error.message);
    if (editingTraining?.id === id) {
      setTrainingPanel(false);
      setEditingTraining(null);
    }
    await load(session.user);
  }
  async function deleteCompetition(competition: Competition) {
    if (!session) return;
    setDeletingCompetitionId(competition.id);
    setNotice('');
    const media = competition.competition_media ?? [];
    const { error } = await supabase
      .from('competitions')
      .delete()
      .eq('id', competition.id)
      .eq('owner_id', session.user.id);
    if (error) {
      setDeletingCompetitionId(null);
      return setNotice(error.message);
    }
    let storageError = false;
    if (media.length) {
      const { error: mediaStorageError } = await supabase.storage
        .from('competition-media')
        .remove(media.map((item) => item.storage_path));
      storageError = Boolean(mediaStorageError);
    }
    setCompetitions((items) => items.filter((item) => item.id !== competition.id));
    setMediaUrls((items) => Object.fromEntries(Object.entries(items).filter(([id]) => !media.some((item) => item.id === id))));
    if (eventDetails?.id === competition.id) setEventDetails(null);
    if (debriefFor?.id === competition.id) setDebriefFor(null);
    setCompetitionPendingDeletion(null);
    setDeletingCompetitionId(null);
    setNotice(storageError ? 'Compétition supprimée. Certains fichiers médias n’ont pas pu être retirés du stockage.' : 'Compétition supprimée.');
  }
  function openTrainingForm(date: string, training: TrainingSession | null = null) {
    setTrainingDate(training?.trained_on ?? date);
    setEditingTraining(training);
    setTrainingPanel(true);
  }
  const authScreen = !session && !loading ? (
      <main className="auth-screen min-h-screen grid place-items-center bg-[#14231E] p-5 text-[#15221E]">
        <div className="auth-card w-full max-w-md rounded-[28px] bg-[#F6F7F5] p-8 shadow-2xl">
          <div className="brand mb-6 p-0">
            <span className="brand-mark">
              <Grip size={21} />
            </span>
            <span>rollbook</span>
          </div>
          <span className="eyebrow">
            <span />
            TON CARNET PERSONNEL
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Chaque passage sur le tapis compte.
          </h1>
          <form onSubmit={authenticate}>
            <p className="mt-3 text-sm leading-6 text-[#69766F]">Utilise l’identifiant et le code PIN que Adel t’a transmis.</p>
            <label className="mt-4 block text-[10px] font-bold tracking-widest text-[#67756E]">IDENTIFIANT</label>
            <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="alex_grappling" className="mt-2 w-full rounded-xl border border-[#DCE3DE] bg-white px-4 py-3 outline-none focus:border-[#8DB64D]" />
            <label className="mt-4 block text-[10px] font-bold tracking-widest text-[#67756E]">MOT DE PASSE</label>
            <div className="relative mt-2"><input required inputMode="numeric" minLength={6} maxLength={6} type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value.replace(/\D/g, ''))} placeholder="6 chiffres" className="w-full rounded-xl border border-[#DCE3DE] bg-white px-4 py-3 pr-12 outline-none focus:border-[#8DB64D]" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Masquer le code PIN' : 'Afficher le code PIN'} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#69766F]">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
            <button className="import-button mt-5 w-full" disabled={authLoading} type="submit">{authLoading ? 'Connexion…' : 'Se connecter'} {!authLoading && <ArrowUpRight size={18} />}</button>
          </form>
          <p className="mt-4 text-center text-xs leading-5 text-[#69766F]">
            Ta session reste ouverte sur cet appareil jusqu’à ta déconnexion.
          </p>
          {notice && <p className="mt-4 text-sm text-[#5C7348]">{notice}</p>}
        </div>
      </main>
    ) : null;
  const name =
    profile?.display_name || session?.user.email?.split('@')[0] || 'Athlète';
  const winRate = totals.matches
    ? Math.round((totals.wins / totals.matches) * 100)
    : 0;
  const isAdmin = session?.user.email?.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();
  const week = useMemo(() => {
    const selectedDate = new Date(`${selectedWeek}T12:00:00`);
    const day = selectedDate.getDay() || 7;
    const monday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - day + 1);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
      return { label: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][index], date, iso: [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') };
    });
  }, [selectedWeek]);
  const weekRange = useMemo(() => {
    const format = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
    return `${format.format(week[0].date)} – ${format.format(week[6].date)}`;
  }, [week]);
  const weeklySessions = useMemo(() => trainingSessions.filter((item) => week.some((day) => day.iso === item.trained_on)), [trainingSessions, week]);
  const weeklyVolume = weeklySessions.reduce((total, item) => total + (item.duration_minutes ?? 0), 0);
  const intensityValues = weeklySessions.map((item) => item.intensity).filter((value): value is number => value !== null);
  const weeklyIntensity = intensityValues.length ? intensityValues.reduce((total, value) => total + value, 0) / intensityValues.length : null;
  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = competitions
      .filter((competition) => new Date(`${competition.starts_on}T00:00:00`) >= today)
      .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
      .slice(0, 3)
      .map((competition) => {
        const days = Math.round((new Date(`${competition.starts_on}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
        return {
          id: `competition-${competition.id}`,
          page: 'competitions' as Page,
          icon: CalendarDays,
          tone: days <= 3 ? 'urgent' : 'neutral',
          title: days === 0
            ? 'C’est le jour J'
            : days === 1
              ? 'Compétition demain'
              : days <= 7
                ? `Compétition dans ${days} jours`
                : days <= 14
                  ? 'Deux semaines pour se préparer'
                  : `Prochaine compétition dans ${days} jours`,
          text: `${competition.name}${competition.city ? ` · ${competition.city}` : ''}`,
        };
      });
    if (!weeklySessions.length) {
      upcoming.push({
        id: 'training-week',
        page: 'training',
        icon: Dumbbell,
        tone: 'positive',
        title: 'Semaine à lancer',
        text: 'Planifie ta première séance pour garder le rythme.',
      });
    } else if (weeklyVolume < 180) {
      upcoming.push({
        id: 'training-volume',
        page: 'training' as Page,
        icon: Target,
        tone: 'neutral',
        title: `${180 - weeklyVolume} min avant ton objectif`,
        text: `${weeklyVolume} min enregistrées cette semaine sur 180 min visées.`,
      });
    }
    const recentUnreviewed = competitions
      .filter((competition) => new Date(`${competition.starts_on}T12:00:00`) < today && !competition.notes && !competition.debrief_focus)
      .sort((a, b) => b.starts_on.localeCompare(a.starts_on))[0];
    if (recentUnreviewed) {
      upcoming.push({
        id: `debrief-${recentUnreviewed.id}`,
        page: 'competitions' as Page,
        icon: Sparkles,
        tone: 'positive',
        title: 'Un débrief à garder en mémoire',
        text: `Ajoute ton ressenti sur ${recentUnreviewed.name}.`,
      });
    }
    return upcoming.slice(0, 5);
  }, [competitions, weeklySessions.length, weeklyVolume]);
  const visibleNotifications = notifications.filter((notification) => !dismissedNotificationIds.includes(notification.id));
  useEffect(() => {
    if (browserNotificationPermission !== 'granted' || !visibleNotifications.length) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `rollbook-notifications-${today}`;
    const seen = new Set<string>(JSON.parse(window.sessionStorage.getItem(key) ?? '[]'));
    const newNotifications = visibleNotifications.filter((notification) => !seen.has(notification.id)).slice(0, 2);
    newNotifications.forEach((notification) => {
      new Notification(notification.title, { body: notification.text, icon: '/favicon.svg', tag: notification.id });
      seen.add(notification.id);
    });
    window.sessionStorage.setItem(key, JSON.stringify([...seen]));
  }, [browserNotificationPermission, visibleNotifications]);
  async function enableBrowserNotifications() {
    if (!('Notification' in window)) {
      setBrowserNotificationPermission('unsupported');
      return;
    }
    const permission = await Notification.requestPermission();
    setBrowserNotificationPermission(permission);
    if (permission === 'granted') setNotice('Les alertes de rappel sont activées sur cet appareil.');
    if (permission === 'denied') setNotice('Les alertes sont bloquées par le navigateur. Tu peux les autoriser dans les réglages du site.');
  }
  const upcomingCompetitions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setMonth(limit.getMonth() + 2);
    return competitions
      .filter((competition) => {
        const startsOn = new Date(`${competition.starts_on}T12:00:00`);
        return startsOn >= today && startsOn <= limit;
      })
      .sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  }, [competitions]);
  const nextCompetition = upcomingCompetitions[0] ?? null;
  const nextCompetitionCountdown = useMemo(() => {
    if (!nextCompetition) return null;
    const target = new Date(`${nextCompetition.starts_on}T00:00:00`).getTime();
    const remaining = Math.max(0, target - countdownNow);
    const totalMinutes = Math.floor(remaining / 60_000);
    return {
      days: Math.floor(totalMinutes / 1_440),
      hours: Math.floor((totalMinutes % 1_440) / 60),
      minutes: totalMinutes % 60,
    };
  }, [countdownNow, nextCompetition]);
  if (authScreen) return authScreen;
  const displayedCompetitions = page === 'overview' ? upcomingCompetitions : competitions;
  const nav = [
    ['overview', Compass, 'Vue d’ensemble'],
    ['competitions', Trophy, 'Compétitions'],
    ['training', Dumbbell, 'Journal d’entraînement'],
    ['regulations', BookOpen, 'Règlements'],
    ...(isAdmin ? [['athletes', ShieldCheck, 'Athlètes'] as const] : []),
  ] as const;
  const heading =
    page === 'training' ? (
      <>
        Le travail entre
        <br />
        <em>deux tapis.</em>
      </>
    ) : page === 'competitions' ? (
      <>
        Tes compétitions,
        <br />
        <em>sans angle mort.</em>
      </>
    ) : page === 'athletes' ? (
      <>
        Crée les accès,
        <br />
        <em>sans e-mail.</em>
      </>
    ) : (
      <>
        Chaque passage sur le tapis
        <br />
        <em>compte.</em>
      </>
    );
  return (
    <main className="min-h-screen bg-[#F6F7F5] text-[#15221E]">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Grip size={21} />
          </span>
          <span>rollbook</span>
        </div>
        <nav>
          {nav.map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              className={page === key ? 'nav-active' : ''}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <button onClick={() => setConfirmLogout(true)}>
            <LogOut size={19} />
            <span>Se déconnecter</span>
          </button>
          <div className="profile">
            <div>{name.slice(0, 2).toUpperCase()}</div>
            <span>
              <b>{name}</b>
              <small>{profile?.belt_rank || 'Athlète'}</small>
            </span>
          </div>
        </div>
      </aside>
      <section className="content">
        <header className="topbar">
          <div className="season">
            <CalendarDays size={17} />
            <span>Saison {new Date().getFullYear()}</span>
          </div>
          <div className="topbar-actions">
            <button
              className={`notification-trigger ${visibleNotifications.length ? 'has-notifications' : ''}`}
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label={`${visibleNotifications.length} notification${visibleNotifications.length > 1 ? 's' : ''}`}
              aria-expanded={notificationsOpen}
            >
              <Bell size={18} />
              {visibleNotifications.length > 0 && <span>{visibleNotifications.length}</span>}
            </button>
            {page !== 'regulations' && (
              <button className="add-button" onClick={() => setPanel(true)}>
                <Plus size={18} />
                Ajouter une compétition
              </button>
            )}
          </div>
        </header>
        {notificationsOpen && (
          <aside className="notification-panel" aria-label="Notifications">
            <div className="notification-panel-head">
              <div><span className="eyebrow"><span />À SUIVRE</span><h2>Notifications</h2></div>
              {visibleNotifications.length > 0 && <button onClick={() => setDismissedNotificationIds(notifications.map((notification) => notification.id))}>Tout lire</button>}
            </div>
            {browserNotificationPermission !== 'granted' && browserNotificationPermission !== 'unsupported' && (
              <button className="notification-enable" type="button" onClick={() => void enableBrowserNotifications()}>
                <Bell size={15} /> {browserNotificationPermission === 'denied' ? 'Alertes bloquées dans le navigateur' : 'Activer les alertes sur cet appareil'}
              </button>
            )}
            {browserNotificationPermission === 'granted' && <p className="notification-status"><Check size={14} /> Alertes activées sur cet appareil</p>}
            {visibleNotifications.length ? (
              <div className="notification-list">
                {visibleNotifications.map((notification) => {
                  const Icon = notification.icon;
                  return <button className={`notification-item ${notification.tone}`} key={notification.id} onClick={() => { setPage(notification.page); setDismissedNotificationIds((ids) => [...ids, notification.id]); setNotificationsOpen(false); }}>
                    <span className="notification-icon"><Icon size={17} /></span>
                    <span><b>{notification.title}</b><small>{notification.text}</small></span>
                    <ChevronRight size={16} />
                  </button>;
                })}
              </div>
            ) : <p className="notification-empty">Tout est à jour. Reviens ici avant ta prochaine échéance.</p>}
          </aside>
        )}
        <div className="page-inner">
          {page === 'regulations' ? (
            <Regulations />
          ) : page === 'athletes' && isAdmin ? (
            <>
              <span className="eyebrow"><span />ESPACE ADEL</span>
              <h1>{heading}</h1>
              <p className="intro">Chaque athlète obtient son identifiant et son code PIN personnel.</p>
              <section className="mt-8 max-w-2xl rounded-2xl border border-[#DCE3DE] bg-white p-6">
                <span className="eyebrow"><span />NOUVEL ATHLÈTE</span>
                <form className="mt-5 grid gap-4" onSubmit={createAthlete}>
                  <label>PRÉNOM OU NOM D’AFFICHAGE<input required value={athleteName} onChange={(event) => setAthleteName(event.target.value)} placeholder="Alex Martin" className="mt-2 w-full rounded-xl border border-[#DCE3DE] px-4 py-3" /></label>
                  <label>IDENTIFIANT<input required value={athleteUsername} onChange={(event) => setAthleteUsername(event.target.value.toLowerCase())} placeholder="alex_grappling" className="mt-2 w-full rounded-xl border border-[#DCE3DE] px-4 py-3" /></label>
                  <label>CODE PIN À 6 CHIFFRES<input required inputMode="numeric" maxLength={6} value={athletePin} onChange={(event) => setAthletePin(event.target.value.replace(/\D/g, ''))} placeholder="123456" className="mt-2 w-full rounded-xl border border-[#DCE3DE] px-4 py-3" /></label>
                  <button className="import-button w-full" disabled={creatingAthlete || athletePin.length !== 6} type="submit">{creatingAthlete ? 'Création…' : 'Créer l’accès athlète'}</button>
                </form>
              </section>
              <section className="mt-6 max-w-2xl rounded-2xl border border-[#DCE3DE] bg-white p-6">
                <span className="eyebrow"><span />ATHLÈTES CRÉÉS</span>
                {athletes.length ? <div className="mt-4 grid gap-2">{athletes.map((athlete) => <div key={athlete.id} className="athlete-row"><span><b>{athlete.displayName}</b><small>@{athlete.username}</small></span><div className="athlete-row-actions"><button className="athlete-reset" onClick={() => { setResetFor(athlete); setResetPin(''); }}><ShieldCheck size={15} /> Réinitialiser le PIN</button><button className="text-[#9AA6A0]" aria-label={`Supprimer ${athlete.displayName}`} title="Supprimer l’athlète" onClick={() => void deleteAthlete(athlete)}><Trash2 size={16} /></button></div></div>)}</div> : <p className="mt-3 text-sm text-[#69766F]">Aucun athlète créé pour le moment.</p>}
              </section>
            </>
          ) : (
            <>
              <span className="eyebrow">
                <span />
                {page === 'training'
                  ? 'JOURNAL D’ENTRAÎNEMENT'
                  : page === 'competitions'
                    ? 'COMPÉTITIONS'
                    : 'TON CARNET DE COMPÉTITION'}
              </span>
              <h1>{heading}</h1>
              <p className="intro">
                {page === 'training'
                  ? 'Planifie tes séances, note ton ressenti et garde un historique utile de ton travail.'
                  : page === 'competitions'
                    ? 'Retrouve tes résultats et suis ton évolution, compétition après compétition.'
                    : 'Retrouve tes résultats, tes combats et les progrès de ta saison.'}
              </p>
              {page === 'training' && (
                <>
                  <section className="stats-grid training-stats mt-8">
                    <article className="stat-card training-stat-card training-stat-sessions">
                      <div className="training-stat-heading"><CalendarDays size={15} /><span className="stat-label">Cette semaine</span></div>
                      <div className="big-number">{weeklySessions.length}</div>
                      <small>séance{weeklySessions.length > 1 ? 's' : ''} enregistrée{weeklySessions.length > 1 ? 's' : ''}</small>
                    </article>
                    <article className="stat-card training-stat-card training-stat-volume">
                      <div className="training-stat-heading"><Dumbbell size={15} /><span className="stat-label">Volume</span></div>
                      <div className="big-number">{weeklyVolume}<span className="text-base"> min</span></div>
                      <small>objectif : 180 min</small>
                    </article>
                    {weeklyIntensity !== null && <article className="stat-card training-stat-card training-stat-intensity">
                      <div className="training-stat-heading"><Flame size={15} /><span className="stat-label">Intensité moyenne</span></div>
                      <div className="big-number">{weeklyIntensity.toFixed(1)}<span className="text-base"> /10</span></div>
                      <small>ressenti de la semaine</small>
                    </article>}
                  </section>
                  <section className="mt-8 rounded-2xl border border-[#DCE3DE] bg-white p-6"><span className="eyebrow"><span />CALENDRIER HEBDOMADAIRE</span><div className="training-calendar-head mt-2"><div><h2>Planifier et suivre tes séances</h2><div className="week-controls"><button type="button" onClick={() => setSelectedWeek((value) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() - 7); return date.toISOString().slice(0, 10); })} aria-label="Semaine précédente"><ChevronLeft size={16} /></button><label><span>{weekRange}</span><input type="date" value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)} aria-label="Choisir une semaine" /></label><button type="button" onClick={() => setSelectedWeek((value) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + 7); return date.toISOString().slice(0, 10); })} aria-label="Semaine suivante"><ChevronRight size={16} /></button><button type="button" className="week-today" onClick={() => setSelectedWeek(new Date().toISOString().slice(0, 10))}>Aujourd’hui</button></div></div><button className="text-button" onClick={() => openTrainingForm(selectedWeek)}><Plus size={16} /> Ajouter une séance</button></div><div className="training-week-grid mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">{week.map((day) => { const sessions = trainingSessions.filter((item) => item.trained_on === day.iso); return <div key={day.iso} className="min-h-36 rounded-xl bg-[#F6F7F5] p-3"><div className="flex items-center justify-between"><b>{day.label}</b><small className="text-[#69766F]">{day.date.getDate()}</small></div><div className="mt-2 grid gap-1">{sessions.map((item) => <div key={item.id} className="group rounded-lg bg-white p-2 text-xs shadow-sm"><div className="flex items-start justify-between gap-1"><button className="text-left font-bold text-[#15221E]" onClick={() => openTrainingForm(day.iso, item)}>{item.focus || 'Entraînement'}</button><button aria-label="Supprimer la séance" className="text-[#9AA6A0]" onClick={() => void deleteTrainingSession(item.id)}><Trash2 size={13} /></button></div><button className="mt-1 text-left text-[#69766F]" onClick={() => openTrainingForm(day.iso, item)}>{item.duration_minutes ?? 0} min · {item.intensity ?? '—'}/10{item.notes ? ' · note' : ''}</button></div>)}</div><button aria-label={`Ajouter une séance le ${day.label}`} className="mt-2 block w-full rounded-lg border border-dashed border-[#B9C8BC] py-2 text-[#71933E]" onClick={() => openTrainingForm(day.iso)}><Plus className="mx-auto" size={16} /></button></div>; })}</div><div className="mt-5 grid gap-3 md:grid-cols-3 text-sm text-[#69766F]"><p>Volume : durée et fréquence des entraînements.</p><p>Intensité : ressenti de 1 à 10 à chaque séance.</p><p>Ouvre une séance pour lire, modifier ou supprimer sa note.</p></div></section>
                </>
              )}
              {notice && (
                <p className="mt-5 rounded-xl bg-[#E4EDD4] px-4 py-3 text-sm text-[#385021]">
                  {notice}
                </p>
              )}
              {page === 'overview' && (
                <>
                <section className="stats-grid overview-stats">
                  <article className="stat-card primary season-summary-card">
                    <div className="season-summary-content">
                      <div className="season-summary-heading"><span className="stat-label">Bilan de saison</span><Trophy size={15} /></div>
                      <div className="season-record">
                        <div><strong>{totals.wins}</strong><span>victoire{totals.wins > 1 ? 's' : ''}</span></div>
                        <div><strong>{totals.losses}</strong><span>défaite{totals.losses > 1 ? 's' : ''}</span></div>
                        <div><strong>{totals.matches}</strong><span>combat{totals.matches > 1 ? 's' : ''} · {competitions.length} épreuve{competitions.length > 1 ? 's' : ''}</span></div>
                      </div>
                      <div className="positive">
                        <ArrowUpRight size={15} /> Données issues de tes combats
                      </div>
                    </div>
                    <div className="season-rate" style={{ '--rate': `${winRate * 3.6}deg` } as React.CSSProperties}>
                      <div><strong><span>{winRate}</span><b>%</b></strong><span>de victoires</span></div>
                    </div>
                  </article>
                </section>
                <section className="next-competition-countdown" aria-live="polite">
                  {nextCompetition && nextCompetitionCountdown ? (
                    <>
                      <div className="countdown-intro">
                        <span className="eyebrow"><span />PROCHAINE COMPÉTITION</span>
                        <h2>{nextCompetition.name}</h2>
                        <p><CalendarDays size={15} /> {new Date(`${nextCompetition.starts_on}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}{nextCompetition.city && <><span>·</span><MapPin size={15} /> {nextCompetition.city}</>}</p>
                      </div>
                      <div className="countdown-values" aria-label={`Compte à rebours : ${nextCompetitionCountdown.days} jours, ${nextCompetitionCountdown.hours} heures et ${nextCompetitionCountdown.minutes} minutes`}>
                        <div><strong>{nextCompetitionCountdown.days}</strong><span>jours</span></div>
                        <div><strong>{String(nextCompetitionCountdown.hours).padStart(2, '0')}</strong><span>heures</span></div>
                        <div><strong>{String(nextCompetitionCountdown.minutes).padStart(2, '0')}</strong><span>min.</span></div>
                      </div>
                    </>
                  ) : (
                    <div className="countdown-empty">
                      <CalendarDays size={20} />
                      <div><span className="eyebrow"><span />PROCHAINE COMPÉTITION</span><p>Ajoute une épreuve à venir pour lancer ton compte à rebours.</p></div>
                    </div>
                  )}
                </section>
                </>
              )}
              <section className="section-head">
                <div>
                  <span className="eyebrow">
                    <span />
                    {page === 'competitions'
                      ? 'ARCHIVES DE SAISON'
                      : 'À VENIR · 2 PROCHAINS MOIS'}
                  </span>
                  <h2>
                    {page === 'competitions'
                      ? 'Tous tes passages sur le tapis'
                      : 'Tes prochaines échéances'}
                  </h2>
                </div>
                {page === 'overview' && (
                  <button
                    className="text-button"
                    onClick={() => setPage('competitions')}
                  >
                    Voir tout <ChevronRight size={16} />
                  </button>
                )}
              </section>
              {loading ? (
                <div className="rounded-2xl border border-[#E4E9E5] bg-white p-8 text-sm text-[#69766F]">
                  Préparation de ton carnet…
                </div>
              ) : displayedCompetitions.length ? (
                <section className="event-grid">
                  {displayedCompetitions.map((item, index) => (
                    <article
                      key={item.id}
                      className="event-card event-card-clickable"
                      role="button"
                      tabIndex={0}
                      aria-label={`Voir les débriefs de ${item.name}`}
                      onClick={() => setEventDetails(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setEventDetails(item);
                        }
                      }}
                    >
                      <div
                        className={`event-visual ${accents[index % accents.length]}`}
                        style={
                          item.cover_image_url
                            ? {
                                backgroundImage: `linear-gradient(180deg,rgba(15,29,22,.12),rgba(15,29,22,.52)), url(${item.cover_image_url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : undefined
                        }
                      >
                        <div className="grain" />
                        <span className="event-date">
                          {new Intl.DateTimeFormat('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }).format(new Date(`${item.starts_on}T12:00:00`))}
                        </span>
                        <span className="event-city">
                          <MapPin size={14} />
                          {item.city || 'Lieu à préciser'}
                        </span>
                      </div>
                      <div className="event-body">
                        <div className="result-row">
                          <span className="result">
                            {item.medal
                              ? medals[item.medal]
                              : item.placement
                                ? `${item.placement}e place`
                                : 'Résultat à compléter'}
                          </span>
                          <ScoreRing value={item.overall_score} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#71933E]">
                          {item.starts_on >= new Date().toISOString().slice(0, 10) ? 'À venir' : 'Terminé'}
                        </span>
                        <h3>{item.name}</h3>
                        <p>
                          {[item.division, item.weight_class, item.ruleset]
                            .filter(Boolean)
                            .join(' · ') || 'Catégorie à compléter'}
                        </p>
                        <div className="event-data">
                          <span>
                            <Swords size={15} />
                            {item.matches?.length ?? 0} combat
                            {(item.matches?.length ?? 0) > 1 ? 's' : ''}
                          </span>
                          <span>
                            <Target size={15} />
                            {item.notes ? 'Analyse ajoutée' : 'À analyser'}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="reflection">
                            <Sparkles size={15} />
                            <span>{item.notes}</span>
                          </div>
                        )}
                        <div className="event-actions">
                          <button
                            className="event-action-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEventDetails(item);
                            }}
                          >
                            <Eye size={15} /> Voir les détails
                          </button>
                          <button
                            className="event-action-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDebriefStep(1);
                              setDebriefFor(item);
                            }}
                          >
                            <Target size={15} /> Ajouter un débrief
                          </button>
                          <button
                            className="event-action-button danger"
                            disabled={deletingCompetitionId === item.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              setNotice('');
                              setCompetitionPendingDeletion(item);
                            }}
                          >
                            <Trash2 size={15} /> {deletingCompetitionId === item.id ? 'Suppression…' : 'Supprimer'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              ) : (
                <section className="rounded-2xl border border-dashed border-[#B9C8BC] bg-white p-9 text-center">
                  <Trophy className="mx-auto mb-3 text-[#71933E]" size={30} />
                  <h3 className="text-lg font-bold">{page === 'overview' ? 'Aucune compétition dans les deux prochains mois.' : 'Ta saison commence ici.'}</h3>
                  <p className="mt-2 text-sm text-[#69766F]">
                    {page === 'overview' ? 'Consulte l’archive complète ou ajoute une nouvelle échéance.' : 'Ajoute ta première compétition : elle apparaîtra instantanément dans ton bilan.'}
                  </p>
                  <button
                    className="import-button mx-auto mt-5 w-auto"
                    onClick={() => page === 'overview' ? setPage('competitions') : setPanel(true)}
                  >
                    {page === 'overview' ? <><Eye size={17} /> Voir toutes les compétitions</> : <><Plus size={17} /> Ajouter une compétition</>}
                  </button>
                </section>
              )}
              {page === 'overview' && (
                <section className="review-card">
                  <div className="review-icon">
                    <Flame size={23} />
                  </div>
                  <div>
                    <span className="eyebrow">
                      <span />
                      POINT D’ATTENTION
                    </span>
                    <h3>
                      {competitions.length
                        ? 'Continue à enrichir tes combats.'
                        : 'Ajoute ta première compétition.'}
                    </h3>
                    <p>
                      {competitions.length
                        ? 'Ajoute les résultats de chaque combat pour enrichir tes statistiques de victoire, soumission et score.'
                        : 'Une fois la compétition créée, tu pourras enregistrer chaque combat et suivre tes progrès.'}
                    </p>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </section>
      <nav className="mobile-nav" aria-label="Navigation mobile">
        {nav.map(([key, Icon, label]) => (
          <button key={key} onClick={() => setPage(key)} className={page === key ? 'selected' : ''}>
            <Icon size={19} />
            <span>{label === 'Vue d’ensemble' ? 'Accueil' : label === 'Journal d’entraînement' ? 'Journal' : label}</span>
          </button>
        ))}
        <button className="mobile-add" onClick={() => setPanel(true)} aria-label="Ajouter une compétition"><Plus size={21} /></button>
      </nav>
      {competitionPendingDeletion && (
        <div className="modal-wrap centered-form-modal-wrap" role="presentation">
          <section className="modal centered-form-modal delete-confirmation" role="dialog" aria-modal="true" aria-labelledby="delete-competition-title">
            <button className="close" type="button" onClick={() => setCompetitionPendingDeletion(null)} aria-label="Fermer"><X size={19} /></button>
            <div className="delete-confirmation-icon"><Trash2 size={22} /></div>
            <span className="eyebrow"><span />SUPPRESSION DÉFINITIVE</span>
            <h2 id="delete-competition-title">Supprimer cette compétition ?</h2>
            <p><strong>{competitionPendingDeletion.name}</strong> et ses combats, débriefs et médias associés seront supprimés définitivement.</p>
            <div className="delete-confirmation-actions">
              <button className="text-button" type="button" onClick={() => setCompetitionPendingDeletion(null)}>Annuler</button>
              <button className="delete-confirm-button" type="button" disabled={deletingCompetitionId === competitionPendingDeletion.id} onClick={() => void deleteCompetition(competitionPendingDeletion)}><Trash2 size={16} /> {deletingCompetitionId === competitionPendingDeletion.id ? 'Suppression…' : 'Supprimer définitivement'}</button>
            </div>
          </section>
        </div>
      )}
      {resetFor && (
        <div className="modal-wrap centered-form-modal-wrap">
          <form className="modal centered-form-modal" onSubmit={resetAthletePin}>
            <button className="close" type="button" onClick={() => { setResetFor(null); setResetPin(''); }} aria-label="Fermer"><X size={19} /></button>
            <div className="import-mark"><ShieldCheck size={23} /></div>
            <span className="eyebrow"><span />ACCÈS ATHLÈTE</span>
            <h2>Réinitialiser le PIN</h2>
            <p>Choisis un nouveau code à 6 chiffres pour <strong>{resetFor.displayName}</strong>. Transmets-le de façon sûre : il ne sera jamais affiché de nouveau.</p>
            <label>NOUVEAU CODE PIN</label>
            <input required autoFocus inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} value={resetPin} onChange={(event) => setResetPin(event.target.value.replace(/\D/g, ''))} placeholder="6 chiffres" />
            <button className="import-button mt-4" disabled={resettingPin || resetPin.length !== 6} type="submit">{resettingPin ? 'Réinitialisation…' : 'Définir ce nouveau PIN'}</button>
          </form>
        </div>
      )}
      {trainingPanel && (
        <div className="modal-wrap training-modal-wrap">
          <form key={editingTraining?.id ?? 'new'} className="modal training-modal" onSubmit={addTrainingSession}>
            <button className="close" type="button" onClick={() => { setTrainingPanel(false); setEditingTraining(null); }} aria-label="Fermer"><X size={19} /></button>
            <div className="import-mark"><Dumbbell size={23} /></div>
            <span className="eyebrow"><span />{editingTraining ? 'SUIVI DE SÉANCE' : 'NOUVELLE SÉANCE'}</span>
            <h2>{editingTraining ? 'Relis ou ajuste ta séance.' : 'Enregistre ton entraînement.'}</h2>
            <p>{editingTraining ? 'Ta note et tes indicateurs restent modifiables à tout moment.' : 'Quelques données simples suffisent pour suivre ta charge de travail semaine après semaine.'}</p>
            <label>DATE</label>
            <input required type="date" value={trainingDate} onChange={(event) => setTrainingDate(event.target.value)} />
            <label>TYPE / FOCUS</label>
            <input name="focus" defaultValue={editingTraining?.focus ?? ''} placeholder="Ex. No-Gi · passages de garde" />
            <div className="grid grid-cols-2 gap-3">
              <div><label>DURÉE (MIN)</label><input required name="duration_minutes" defaultValue={editingTraining?.duration_minutes ?? ''} type="number" min="1" max="600" placeholder="90" /></div>
              <div><label>INTENSITÉ /10</label><input required name="intensity" defaultValue={editingTraining?.intensity ?? ''} type="number" min="1" max="10" placeholder="7" /></div>
            </div>
            <div className="training-note-editor">
              <div className="training-note-heading"><Sparkles size={15} /><label>NOTE / RESSENTI</label><span>facultatif</span></div>
              <textarea name="notes" rows={4} maxLength={360} defaultValue={editingTraining?.notes ?? ''} placeholder="Décris ton ressenti : ce qui a bien fonctionné, ce que tu veux reprendre…" />
              <p><span>✦</span> Une phrase suffit pour retrouver l’essentiel de ta séance.</p>
            </div>
            <div className="training-modal-actions">
              {editingTraining && <button className="text-button text-red-700" type="button" onClick={() => void deleteTrainingSession(editingTraining.id)}><Trash2 size={16} /> Supprimer</button>}
              <button className="import-button" disabled={savingTraining} type="submit">{savingTraining ? 'Enregistrement…' : <><Check size={19} /> {editingTraining ? 'Enregistrer les modifications' : 'Enregistrer la séance'}</>}</button>
            </div>
            <small><CircleDot size={13} /> Visible uniquement dans ton compte.</small>
          </form>
        </div>
      )}
      {panel && (
        <div className="modal-wrap competition-modal-wrap">
          <form className="modal competition-modal" onSubmit={addCompetition}>
            <button
              className="close"
              type="button"
              onClick={() => setPanel(false)}
            >
              <X size={19} />
            </button>
            <div className="import-mark">
              <Trophy size={23} />
            </div>
            <span className="eyebrow">
              <span />
              NOUVELLE ÉPREUVE
            </span>
            <div className="modal-steps"><span className={modalStep === 1 ? 'active' : ''}>1. Événement</span><span className={modalStep === 2 ? 'active' : ''}>2. Tes infos</span></div>
            <h2>{modalStep === 1 ? 'Importe l’événement.' : 'Complète tes informations.'}</h2>
            <p>
              {modalStep === 1 ? 'Colle la page de l’événement : ses informations seront préremplies.' : 'Ajoute ta catégorie, ton poids, le règlement et une note personnelle.'}
            </p>
            {modalStep === 1 ? <div key="competition-event-step">
            <label>LIEN DE L’ÉVÉNEMENT</label><div className="source-import">
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://smoothcomp.com/event/..."
              />
              <button
                type="button"
                onClick={() => void importEvent()}
                disabled={importing || !sourceUrl.trim()}
              >
                {importing ? 'Lecture…' : 'Récupérer'}
              </button>
            </div>
            <small className="source-help">
              Smoothcomp et les pages de compétition CFJJB sont pris en charge.
            </small>
            {notice && <p className="modal-notice">{notice}</p>}
            <label>NOM DE LA COMPÉTITION</label>
            <input
              required
              name="name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Paris Open No-Gi"
            />
            <label>DATE</label>
            <input required name="starts_on" type="date" value={draftStartsOn} onChange={(event) => setDraftStartsOn(event.target.value)} />
            <label>VILLE</label>
            <input
              name="city"
              value={draftCity}
              onChange={(event) => setDraftCity(event.target.value)}
              placeholder="Paris"
            />
            <button type="button" className="import-button" onClick={() => { if (!draftName.trim() || !draftStartsOn) return setNotice('Renseigne le nom et la date de l’événement.'); setNotice(''); setModalStep(2); }}>
              Continuer <ArrowUpRight size={19} />
            </button>
            </div> : <div key="competition-details-step">
            <label>CATÉGORIE</label>
            <select name="division" defaultValue="">
              <option value="" disabled>Choisir une catégorie</option>
              <option value="Gi">Gi</option>
              <option value="No-Gi">No-Gi</option>
              <option value="Gi & No-Gi">Gi & No-Gi</option>
            </select>
            <label>POIDS</label>
            <input name="weight_class" placeholder="-76 kg" />
            <label>RÈGLEMENT</label>
            <input name="ruleset" placeholder="ADCC, IBJJF…" />
            <label>NOTE PERSONNELLE</label>
            <input name="notes" placeholder="Ce que tu veux retenir" />
            <button type="button" className="text-button mt-4" onClick={() => setModalStep(1)}>← Retour à l’événement</button>
            <button className="import-button" disabled={saving} type="submit">
              {saving ? (
                'Enregistrement…'
              ) : (
                <>
                  <Check size={19} />
                  Enregistrer la compétition
                </>
              )}
            </button>
            </div>}
            <small>
              <CircleDot size={13} />
              Visible uniquement dans ton compte.
            </small>
          </form>
        </div>
      )}
      {debriefFor && (
        <div className="modal-wrap centered-form-modal-wrap">
          <form className="modal centered-form-modal" onSubmit={saveDebrief}>
            <button className="close" type="button" onClick={() => setDebriefFor(null)} aria-label="Fermer"><X size={19} /></button>
            <div className="import-mark"><Target size={23} /></div>
            <span className="eyebrow"><span />APRÈS LA COMPÉTITION</span>
            <div className="modal-steps"><span className={debriefStep === 1 ? 'active' : ''}>1. Bilan</span><span className={debriefStep === 2 ? 'active' : ''}>2. Combats</span><span className={debriefStep === 3 ? 'active' : ''}>3. Médias</span></div>
            <h2>Débrief de {debriefFor.name}</h2>
            <p>{debriefStep === 1 ? 'Bilan global de ta journée.' : debriefStep === 2 ? 'Détails et analyse de tes combats.' : 'Ajoute les photos et médias de la compétition.'}</p>
            {debriefStep === 1 && <>
            <label>VICTOIRES</label><input required min="0" name="wins" type="number" value={debriefDraft.wins} onChange={(event) => setDebriefDraft((draft) => ({ ...draft, wins: event.target.value }))} />
            <label>DÉFAITES</label><input required min="0" name="losses" type="number" value={debriefDraft.losses} onChange={(event) => setDebriefDraft((draft) => ({ ...draft, losses: event.target.value }))} />
            <label>MATCHS NULS</label><input min="0" name="draws" type="number" value={debriefDraft.draws} onChange={(event) => setDebriefDraft((draft) => ({ ...draft, draws: event.target.value }))} />
            <button type="button" className="import-button" onClick={() => setDebriefStep(2)}>Continuer</button></>}
            {debriefStep === 2 && <>
            <label>NOTE GLOBALE / 10</label><input min="0" max="10" step="0.1" name="score" type="number" placeholder="8.5" value={debriefDraft.score} onChange={(event) => setDebriefDraft((draft) => ({ ...draft, score: event.target.value }))} />
            <label>NOTE PERSONNELLE</label><input name="notes" placeholder="Ce que tu veux retenir" value={debriefDraft.notes} onChange={(event) => setDebriefDraft((draft) => ({ ...draft, notes: event.target.value }))} />
            <label>POINT FORT / AXE DE TRAVAIL</label><input name="focus" placeholder="Ex. pression au sol / défense des clés de jambe" value={debriefDraft.focus} onChange={(event) => setDebriefDraft((draft) => ({ ...draft, focus: event.target.value }))} />
            <button type="button" className="import-button" onClick={() => setDebriefStep(3)}>Continuer</button></>}
            {debriefStep === 3 && <>
            <label>PHOTOS ET MÉDIAS</label><input name="media" type="file" accept="image/*,video/*" multiple />
            <p className="text-xs">Ajoute les photos ou vidéos à retrouver dans la fiche événement.</p>
            <button className="import-button" disabled={savingDebrief} type="submit">{savingDebrief ? 'Enregistrement…' : <><Check size={19} /> Enregistrer le débrief</>}</button>
            </>}
          </form>
        </div>
      )}
      {eventDetails && (
        <div className="modal-wrap" onMouseDown={() => setEventDetails(null)}>
          <section
            className={`modal event-details-modal ${((eventDetails.notes?.length ?? 0) > 110 || (eventDetails.debrief_focus?.length ?? 0) > 110) ? 'has-long-content' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-details-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="close" type="button" onClick={() => setEventDetails(null)} aria-label="Fermer"><X size={19} /></button>
            <div
              className="event-details-hero"
              style={eventDetails.cover_image_url ? {
                backgroundImage: `linear-gradient(125deg, rgba(12, 52, 37, .9), rgba(43, 100, 55, .72)), url(${JSON.stringify(eventDetails.cover_image_url)})`,
              } : undefined}
            >
              <span className="event-details-date">
                <CalendarDays size={15} />
                {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${eventDetails.starts_on}T12:00:00`))}
              </span>
              <h2 id="event-details-title">{eventDetails.name}</h2>
              {eventDetails.city && <p><MapPin size={15} /> {eventDetails.city}</p>}
              {eventDetails.source_url && <a className="event-details-source" href={eventDetails.source_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Page de l’événement</a>}
              {(eventDetails.overall_score || eventDetails.matches?.length) && <div className="event-details-quick-results">{eventDetails.overall_score && <span className="event-score">NOTE {eventDetails.overall_score}/10</span>}{!!eventDetails.matches?.length && <><span>{eventDetails.matches.length} combat{eventDetails.matches.length > 1 ? 's' : ''}</span><span>{eventDetails.matches.filter((match) => match.outcome === 'win').length} victoire{eventDetails.matches.filter((match) => match.outcome === 'win').length > 1 ? 's' : ''}</span>{eventDetails.matches.some((match) => match.outcome === 'loss') && <span>{eventDetails.matches.filter((match) => match.outcome === 'loss').length} défaite{eventDetails.matches.filter((match) => match.outcome === 'loss').length > 1 ? 's' : ''}</span>}</>}</div>}
            </div>

            {(eventDetails.notes || eventDetails.debrief_focus || eventDetails.division || eventDetails.weight_class || eventDetails.ruleset) && <div className="event-details-section">
              <span className="eyebrow"><span />NOTES & REPÈRES</span>
              <div className="event-details-bento">
                {eventDetails.notes && <div className="event-notes"><BookOpen size={17} /><div><span>NOTE PERSONNELLE</span><p>{eventDetails.notes}</p></div></div>}
                {eventDetails.debrief_focus && <div className="event-focus"><Target size={16} /><div><span>POINT FORT / AXE DE TRAVAIL</span><p>{eventDetails.debrief_focus}</p></div></div>}
                {(eventDetails.division || eventDetails.weight_class || eventDetails.ruleset) && <div className="event-detail-facts">
                  {eventDetails.division && <div><span>DIVISION</span><strong>{eventDetails.division}</strong></div>}
                  {eventDetails.weight_class && <div><span>CATÉGORIE</span><strong>{eventDetails.weight_class}</strong></div>}
                  {eventDetails.ruleset && <div><span>RÈGLEMENT</span><strong>{eventDetails.ruleset}</strong></div>}
                </div>}
              </div>
            </div>}
            {!!eventDetails.competition_media?.length && <div className="event-details-section">
              <div className="event-details-section-title"><span className="eyebrow"><span />MÉDIAS</span><span>{eventDetails.competition_media?.length ?? 0}</span></div>
              <div className="event-media-grid">
                {eventDetails.competition_media.map((media) => {
                  const url = mediaUrls[media.id];
                  return url ? media.media_type === 'video' ? <video key={media.id} controls preload="metadata" src={url} /> : <a key={media.id} href={url} target="_blank" rel="noreferrer"><img src={url} alt={media.caption || `Média de ${eventDetails.name}`} /></a> : null;
                })}
              </div>
            </div>}
            <button type="button" className="import-button" onClick={() => { setEventDetails(null); setDebriefStep(1); setDebriefFor(eventDetails); }}><Target size={18} /> Ajouter un débrief</button>
          </section>
        </div>
      )}
      {confirmLogout && <div className="modal-wrap"><div className="modal"><div className="import-mark"><LogOut size={23} /></div><h2>Se déconnecter ?</h2><p>Tu pourras te reconnecter avec ton identifiant et ton code PIN.</p><div className="flex gap-3"><button className="text-button" onClick={() => setConfirmLogout(false)}>Annuler</button><button className="import-button mt-0" onClick={() => void supabase.auth.signOut()}>Valider</button></div></div></div>}
    </main>
  );
}
