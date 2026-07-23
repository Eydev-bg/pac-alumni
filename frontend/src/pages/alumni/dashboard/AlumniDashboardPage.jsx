// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/dashboard/AlumniDashboardPage.jsx
//  Alumni Home Dashboard — blue light-SaaS redesign (Phase A, Batch 2).
//  Multi-column layout: Welcome + Quick Actions + Latest Announcement +
//  Upcoming Event + Latest Jobs (main), Notifications + Recent Messages +
//  Achievements (right rail). Every panel fetches from an EXISTING endpoint
//  and owns its loading skeleton + empty state independently.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import { useUnread } from "../../../context/UnreadContext";
import {
  storageUrl,
  stripHtml,
  timeAgo,
  formatDate,
} from "../../../utils/formatters";
import {
  AlumniCard,
  IconChip,
  SectionHeader,
  ProgressBar,
  Avatar,
  Badge,
} from "../../../components/alumni/ui";
import AchievementFeed from "./AchievementFeed";
import {
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineMegaphone,
  HiOutlineBell,
  HiOutlineMapPin,
  HiOutlineBuildingOffice2,
  HiOutlineArrowRight,
} from "react-icons/hi2";

// Time-of-day greeting from the local clock.
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

// Month / day parts for the event date block.
function dateParts(iso) {
  const d = new Date(iso);
  return {
    mon: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
  };
}

export default function AlumniDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Main column ── */}
        <div className="xl:col-span-2 space-y-6">
          <WelcomeCard />
          <QuickActions />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LatestAnnouncement />
            <UpcomingEvent />
          </div>
          <LatestJobs />
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-6">
          <NotificationsPanel />
          <RecentMessages />
          <AchievementFeed />
        </div>
      </div>
    </div>
  );
}

// ─── Welcome + Profile Completion ───────────────────────────

function WelcomeCard() {
  const [personal, setPersonal] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      alumniApi.getDashboard().catch(() => null),
      alumniApi.getProfileCompletion().catch(() => null),
    ])
      .then(([dash, comp]) => {
        if (!active) return;
        setPersonal(dash?.data?.data?.personal ?? null);
        setCompletion(comp?.data?.data ?? null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <AlumniCard className="p-6">
        <div className="flex flex-col sm:flex-row gap-5 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-56 bg-slate-100 rounded" />
            <div className="h-3 w-72 bg-slate-100 rounded" />
            <div className="h-2 w-full bg-slate-100 rounded-full" />
          </div>
        </div>
      </AlumniCard>
    );
  }

  const firstName = personal?.first_name || personal?.full_name || "there";
  const pct = completion?.percentage ?? 0;

  return (
    <AlumniCard className="p-6">
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Photo */}
        {personal?.profile_picture ? (
          <img
            src={storageUrl(personal.profile_picture)}
            alt={personal.full_name}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <Avatar
            name={personal?.full_name}
            size="xl"
            className="w-20 h-20 rounded-full"
          />
        )}

        {/* Greeting + welcome text */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800">
            {greeting()}, {firstName}! <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            Welcome back to PAC Alumni Community. Let's stay connected and
            continue building our future together.
          </p>
        </div>

        {/* Profile completion */}
        <div className="sm:w-56 sm:border-l sm:border-slate-100 sm:pl-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Profile Completion
            </span>
          </div>
          <p className="text-sm font-bold text-slate-800 mb-2">
            {pct}% Complete
          </p>
          <ProgressBar value={pct} />
          <Link
            to="/alumni/profile"
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue
          </Link>
        </div>
      </div>
    </AlumniCard>
  );
}

// ─── Quick Actions ──────────────────────────────────────────

function QuickActions() {
  const actions = [
    {
      title: "Update Profile",
      desc: "Keep your profile up to date",
      icon: HiOutlineUser,
      color: "blue",
      to: "/alumni/profile",
    },
    {
      title: "Find Alumni",
      desc: "Browse the alumni directory",
      icon: HiOutlineUserGroup,
      color: "orange",
      to: "/alumni/directory",
    },
    {
      title: "Browse Jobs",
      desc: "Find new career opportunities",
      icon: HiOutlineBriefcase,
      color: "green",
      to: "/alumni/careers",
    },
    {
      title: "View Events",
      desc: "See upcoming events",
      icon: HiOutlineCalendarDays,
      color: "purple",
      to: "/alumni/events",
    },
  ];

  // Pastel chip hues (mirrors IconChip's palette). Built inline here so the
  // chip + icon can scale responsively — compact on mobile, larger on lg+.
  const chipColor = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-500",
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-3">
        Quick Actions
      </h2>
      {/* 2×2 on mobile, a single row of 4 on sm+. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group flex flex-col items-center text-center bg-white rounded-xl border border-slate-200/80 shadow-sm p-3 lg:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <span
              className={`inline-flex items-center justify-center flex-shrink-0 rounded-xl w-10 h-10 lg:w-12 lg:h-12 mb-2 lg:mb-3 ${chipColor[a.color]}`}
            >
              <a.icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </span>
            <p className="text-xs lg:text-sm font-semibold text-slate-800 leading-tight">
              {a.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 hidden sm:block">
              {a.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Latest Announcement ────────────────────────────────────

function LatestAnnouncement() {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    alumniApi
      .getAnnouncements({ per_page: 1 })
      .then((res) => active && setItem(res.data.data?.[0] ?? null))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <AlumniCard>
      <SectionHeader
        title="Latest Announcement"
        actionLabel="View All"
        actionTo="/alumni/announcements"
      />
      {loading ? (
        <SkeletonRows lines={3} />
      ) : !item ? (
        <PanelEmpty icon={HiOutlineMegaphone} text="No announcements yet" />
      ) : (
        <Link to="/alumni/announcements" className="flex gap-3 group">
          <IconChip icon={HiOutlineMegaphone} color="blue" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
              {item.title}
            </h4>
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
              {stripHtml(item.content)}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[0.7rem] text-slate-400">
              {item.published_at && <span>{formatDate(item.published_at)}</span>}
              {item.posted_by && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{item.posted_by}</span>
                </>
              )}
            </div>
          </div>
        </Link>
      )}
    </AlumniCard>
  );
}

// ─── Upcoming Event ─────────────────────────────────────────

function UpcomingEvent() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    alumniApi
      .getEvents({ per_page: 6 })
      .then((res) => {
        if (!active) return;
        const items = res.data.data ?? [];
        const now = new Date();
        // Prefer the soonest event that hasn't ended yet; fall back to the
        // first item so the panel isn't empty when all events are past.
        const upcoming = items
          .filter((e) => e.start_datetime && new Date(e.start_datetime) >= now)
          .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
        setEvent(upcoming[0] ?? items[0] ?? null);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <AlumniCard>
      <SectionHeader
        title="Upcoming Event"
        actionLabel="View All"
        actionTo="/alumni/events"
      />
      {loading ? (
        <SkeletonRows lines={3} />
      ) : !event ? (
        <PanelEmpty icon={HiOutlineCalendarDays} text="No upcoming events" />
      ) : (
        <Link to="/alumni/events" className="flex gap-4 group">
          {/* Date block */}
          <div className="flex-shrink-0 w-16 rounded-xl bg-blue-50 py-2 text-center">
            <p className="text-[0.65rem] font-bold text-blue-600">
              {dateParts(event.start_datetime).mon}
            </p>
            <p className="text-2xl font-bold text-slate-800 leading-tight">
              {dateParts(event.start_datetime).day}
            </p>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
              {event.title}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {formatDate(event.start_datetime)}
            </p>
            {event.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <HiOutlineMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </p>
            )}
            {event.going_count > 0 && (
              <Badge color="green" className="mt-2">
                {event.going_count} going
              </Badge>
            )}
          </div>
        </Link>
      )}
    </AlumniCard>
  );
}

// ─── Latest Job Opportunities ───────────────────────────────

function LatestJobs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    alumniApi
      .getJobPostings({ per_page: 3 })
      .then((res) => active && setItems(res.data.data ?? []))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <AlumniCard>
      <SectionHeader
        title="Latest Job Opportunities"
        actionLabel="View All"
        actionTo="/alumni/careers"
      />
      {loading ? (
        <SkeletonRows lines={3} />
      ) : items.length === 0 ? (
        <PanelEmpty icon={HiOutlineBriefcase} text="No job openings yet" />
      ) : (
        <ul className="divide-y divide-slate-100 -my-2">
          {items.map((job) => (
            <li key={job.id}>
              <Link
                to={`/alumni/careers/${job.id}`}
                className="flex items-center gap-3 py-3 group"
              >
                {job.company_logo ? (
                  <img
                    src={storageUrl(job.company_logo)}
                    alt={job.company_name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                  />
                ) : (
                  <IconChip
                    icon={HiOutlineBuildingOffice2}
                    color="slate"
                    size="sm"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                    {job.job_position}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {job.company_name}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                  <HiOutlineMapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[9rem]">{job.location}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AlumniCard>
  );
}

// ─── Notifications panel ────────────────────────────────────

// Icon + hue by notification content type (inferred from the payload).
function notificationStyle(n) {
  if (n.data?.job_posting_id)
    return { icon: HiOutlineBriefcase, color: "green" };
  if (n.data?.announcement_id)
    return { icon: HiOutlineMegaphone, color: "blue" };
  if (n.data?.event_id) return { icon: HiOutlineCalendarDays, color: "purple" };
  return { icon: HiOutlineBell, color: "slate" };
}

function NotificationsPanel() {
  const navigate = useNavigate();
  const unread = useUnread();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    alumniApi
      .getNotifications({ per_page: 4 })
      .then((res) => active && setItems(res.data.data ?? []))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Mirror the bell/notifications-page behavior: mark read then deep-link.
  const open = async (n) => {
    if (!n.is_read) {
      try {
        await alumniApi.markNotificationRead(n.id);
        unread?.decrementNotifications();
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
        );
      } catch {
        // Non-fatal — navigation still proceeds.
      }
    }
    if (n.data?.job_posting_id) navigate(`/alumni/careers/${n.data.job_posting_id}`);
    else if (n.data?.announcement_id) navigate("/alumni/announcements");
    else if (n.data?.event_id) navigate("/alumni/events");
    else navigate("/alumni/notifications");
  };

  return (
    <AlumniCard>
      <SectionHeader
        title="Notifications"
        actionLabel="View All"
        actionTo="/alumni/notifications"
      />
      {loading ? (
        <SkeletonRows lines={3} />
      ) : items.length === 0 ? (
        <PanelEmpty icon={HiOutlineBell} text="No notifications yet" />
      ) : (
        <ul className="space-y-1 -mx-2">
          {items.map((n) => {
            const style = notificationStyle(n);
            return (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className="w-full flex items-start gap-3 p-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                >
                  <IconChip icon={style.icon} color={style.color} size="sm" />
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-sm line-clamp-2 ${
                        !n.is_read
                          ? "font-semibold text-slate-800"
                          : "text-slate-600"
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="block text-[0.7rem] text-slate-400 mt-0.5">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AlumniCard>
  );
}

// ─── Recent Messages panel ──────────────────────────────────

function RecentMessages() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    alumniApi
      .getConversations()
      .then((res) => active && setItems((res.data.data ?? []).slice(0, 4)))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <AlumniCard>
      <SectionHeader
        title="Recent Messages"
        actionLabel="View All"
        actionTo="/alumni/messages"
      />
      {loading ? (
        <SkeletonRows lines={3} />
      ) : items.length === 0 ? (
        <PanelEmpty icon={HiOutlineArrowRight} text="No messages yet" />
      ) : (
        <ul className="space-y-1 -mx-2">
          {items.map((c) => {
            const preview = c.last_message
              ? `${c.last_message.is_mine ? "You: " : ""}${c.last_message.content}`
              : "No messages yet";
            return (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/alumni/messages/${c.id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                >
                  <Avatar
                    src={c.other_participant?.profile_picture}
                    name={c.other_participant?.name}
                    size="sm"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm truncate ${
                          c.unread_count > 0
                            ? "font-bold text-slate-900"
                            : "font-semibold text-slate-700"
                        }`}
                      >
                        {c.other_participant?.name}
                      </span>
                      {c.last_message_at && (
                        <span className="text-[0.65rem] text-slate-400 flex-shrink-0">
                          {timeAgo(c.last_message_at)}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center justify-between gap-2 mt-0.5">
                      <span
                        className={`text-xs truncate ${
                          c.unread_count > 0
                            ? "text-slate-700 font-medium"
                            : "text-slate-400"
                        }`}
                      >
                        {preview}
                      </span>
                      {c.unread_count > 0 && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AlumniCard>
  );
}

// ─── Shared little bits ─────────────────────────────────────

function SkeletonRows({ lines = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-slate-100 rounded" />
            <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelEmpty({ icon: Icon, text }) {
  return (
    <div className="py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2">
        <Icon className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}
