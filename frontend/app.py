import json
import re
import zipfile
from io import BytesIO
from typing import Optional, Tuple, List

import requests
import streamlit as st

API_URL = "http://localhost:8000"


# -----------------------------
# Helpers
# -----------------------------
def safe_slug(title: str) -> str:
    s = title.strip().lower()
    s = re.sub(r"[^a-z0-9 _-]+", "", s)
    s = re.sub(r"\s+", "_", s).strip("_")
    return s or "blog"


# -----------------------------
# Auth
# -----------------------------
def init_session():
    if "token" not in st.session_state:
        st.session_state["token"] = None
    if "username" not in st.session_state:
        st.session_state["username"] = None
    if "current_run_id" not in st.session_state:
        st.session_state["current_run_id"] = None


def login(username, password):
    resp = requests.post(f"{API_URL}/auth/login", json={"username": username, "password": password})
    if resp.status_code == 200:
        data = resp.json()
        st.session_state["token"] = data["access_token"]
        st.session_state["username"] = data["username"]
        st.success("Logged in successfully!")
        st.rerun()
    else:
        st.error(resp.json().get("detail", "Login failed"))


def register(username, password):
    resp = requests.post(f"{API_URL}/auth/register", json={"username": username, "password": password})
    if resp.status_code == 200:
        data = resp.json()
        st.session_state["token"] = data["access_token"]
        st.session_state["username"] = data["username"]
        st.success("Registered and logged in!")
        st.rerun()
    else:
        st.error(resp.json().get("detail", "Registration failed"))


def logout():
    st.session_state["token"] = None
    st.session_state["username"] = None
    st.session_state["current_run_id"] = None
    st.rerun()


def get_headers():
    return {"Authorization": f"Bearer {st.session_state['token']}"}


# -----------------------------
# API Calls
# -----------------------------
def start_run(topic, as_of, audience_pref, tone_pref, blog_kind_pref):
    payload = {
        "topic": topic,
        "as_of": as_of.isoformat(),
        "audience_pref": audience_pref,
        "tone_pref": tone_pref,
        "blog_kind_pref": blog_kind_pref,
    }
    resp = requests.post(f"{API_URL}/api/runs", json=payload, headers=get_headers())
    if resp.status_code == 200:
        run_id = resp.json()["run_id"]
        st.session_state["current_run_id"] = run_id
    else:
        st.error(f"Failed to start run: {resp.text}")


def resume_run(run_id, action, queries=None, instructions=None):
    payload = {"action": action}
    if queries is not None:
        payload["queries"] = queries
    if instructions is not None:
        payload["instructions"] = instructions
        
    resp = requests.post(f"{API_URL}/api/runs/{run_id}/resume", json=payload, headers=get_headers())
    if resp.status_code != 200:
        st.error(f"Failed to resume run: {resp.text}")


def fetch_run(run_id):
    resp = requests.get(f"{API_URL}/api/runs/{run_id}", headers=get_headers())
    if resp.status_code == 200:
        return resp.json()
    return None


def list_runs():
    resp = requests.get(f"{API_URL}/api/runs", headers=get_headers())
    if resp.status_code == 200:
        return resp.json()
    return []


def delete_run(run_id):
    requests.delete(f"{API_URL}/api/runs/{run_id}", headers=get_headers())


# -----------------------------
# Markdown Rendering
# -----------------------------
_MD_IMG_RE = re.compile(r"!\[(?P<alt>[^\]]*)\]\((?P<src>[^)]+)\)")
_CAPTION_LINE_RE = re.compile(r"^\*(?P<cap>.+)\*$")


def render_markdown_with_api_images(md: str, run_id: str):
    matches = list(_MD_IMG_RE.finditer(md))
    if not matches:
        st.markdown(md, unsafe_allow_html=False)
        return

    parts: List[Tuple[str, str]] = []
    last = 0
    for m in matches:
        before = md[last : m.start()]
        if before:
            parts.append(("md", before))
        alt = (m.group("alt") or "").strip()
        src = (m.group("src") or "").strip()
        parts.append(("img", f"{alt}|||{src}"))
        last = m.end()

    tail = md[last:]
    if tail:
        parts.append(("md", tail))

    i = 0
    while i < len(parts):
        kind, payload = parts[i]
        if kind == "md":
            st.markdown(payload, unsafe_allow_html=False)
            i += 1
            continue

        alt, src = payload.split("|||", 1)
        caption = None
        if i + 1 < len(parts) and parts[i + 1][0] == "md":
            nxt = parts[i + 1][1].lstrip()
            if nxt.strip():
                first_line = nxt.splitlines()[0].strip()
                mcap = _CAPTION_LINE_RE.match(first_line)
                if mcap:
                    caption = mcap.group("cap").strip()
                    rest = "\n".join(nxt.splitlines()[1:])
                    parts[i + 1] = ("md", rest)

        if src.startswith("http://") or src.startswith("https://"):
            st.image(src, caption=caption or (alt or None), use_container_width=True)
        else:
            # Assuming src is "images/filename.png"
            filename = src.split("/")[-1]
            img_url = f"{API_URL}/api/runs/{run_id}/images/{filename}"
            resp = requests.get(img_url, headers=get_headers())
            if resp.status_code == 200:
                st.image(resp.content, caption=caption or (alt or None), use_container_width=True)
            else:
                st.warning(f"Image not found on server: `{filename}`")
        i += 1


# -----------------------------
# Main UI
# -----------------------------
st.set_page_config(page_title="BlogForge", layout="wide")
init_session()

if not st.session_state["token"]:
    st.title("Welcome to BlogForge")
    st.write("Please log in or register to continue.")
    
    tab1, tab2 = st.tabs(["Login", "Register"])
    
    with tab1:
        with st.form("login_form"):
            user_l = st.text_input("Username")
            pass_l = st.text_input("Password", type="password")
            if st.form_submit_button("Login"):
                login(user_l, pass_l)
                
    with tab2:
        with st.form("register_form"):
            user_r = st.text_input("Username")
            pass_r = st.text_input("Password", type="password")
            if st.form_submit_button("Register"):
                register(user_r, pass_r)
    st.stop()

# --- Authenticated State ---

st.title(f"BlogForge - Welcome, {st.session_state['username']}")

with st.sidebar:
    st.button("Logout", on_click=logout)
    st.divider()
    
    st.header("New Blog")
    topic = st.text_area("Topic", height=100)
    import datetime
    as_of = st.date_input("As-of date", value=datetime.date.today())

    AUDIENCE_OPTIONS = ["Auto", "Beginners", "Intermediate developers", "Experts", "Non-technical"]
    TONE_OPTIONS = ["Auto", "Professional", "Casual", "Tutorial", "Academic"]
    BLOG_KIND_OPTIONS = ["Auto", "explainer", "tutorial", "news_roundup", "comparison"]

    audience_choice = st.radio("Audience", AUDIENCE_OPTIONS, index=0)
    tone_choice = st.radio("Tone", TONE_OPTIONS, index=0)
    blog_kind_choice = st.radio("Blog kind", BLOG_KIND_OPTIONS, index=0)

    def _pref(c): return None if c == "Auto" else c

    if st.button("🚀 Start Blog Generation", type="primary"):
        if topic.strip():
            start_run(topic.strip(), as_of, _pref(audience_choice), _pref(tone_choice), _pref(blog_kind_choice))
        else:
            st.warning("Please enter a topic.")

    st.divider()
    st.subheader("Your Blogs")
    
    runs = list_runs()
    for r in runs:
        title = r["topic"][:30] + "..." if len(r["topic"]) > 30 else r["topic"]
        status_emoji = "⏳" if r["status"] == "pending" else "🔄" if r["status"] == "running" else "⏸️" if r["status"] == "interrupted" else "❌" if r["status"] == "failed" else "✅"
        label = f"{status_emoji} {title}"
        col1, col2 = st.columns([4, 1])
        with col1:
            if st.button(label, key=f"load_{r['id']}"):
                st.session_state["current_run_id"] = r["id"]
                st.rerun()
        with col2:
            if st.button("🗑️", key=f"del_{r['id']}"):
                delete_run(r["id"])
                if st.session_state["current_run_id"] == r["id"]:
                    st.session_state["current_run_id"] = None
                st.rerun()


run_id = st.session_state["current_run_id"]

if run_id:
    run_data = fetch_run(run_id)
    if not run_data:
        st.error("Run not found or access denied.")
        st.stop()
        
    st.subheader(f"Topic: {run_data['topic']}")
    st.caption(f"Status: {run_data['status'].upper()} | Created: {run_data['created_at']}")
    
    # Auto-refresh if running
    if run_data["status"] in ["pending", "running"]:
        import time
        with st.spinner("Agent is working..."):
            time.sleep(3)
            st.rerun()
            
    # Handle interrupts (HITL)
    if run_data["status"] == "interrupted":
        itype = run_data.get("interrupt_type")
        idata = run_data.get("interrupt_data") or {}
        
        if itype == "research_plan_review":
            st.warning("🧭 Step 1 — Review the research plan")
            queries = idata.get("queries") or []
            queries_text = st.text_area("Search queries (one per line)", value="\n".join(queries), height=150)
            
            c1, c2 = st.columns(2)
            with c1:
                if st.button("✅ Approve & Run Web Search", type="primary"):
                    edited = [q.strip() for q in queries_text.splitlines() if q.strip()]
                    action = "approve" if edited == queries else "edit"
                    resume_run(run_id, action, queries=edited)
                    st.rerun()
            with c2:
                if st.button("⏭️ Skip Research (Closed Book)"):
                    resume_run(run_id, "skip_research")
                    st.rerun()
                    
        elif itype == "final_draft_review":
            st.warning("📝 Step 2 — Review the final draft")
            final_md = idata.get("final_md", "")
            render_markdown_with_api_images(final_md, run_id)
            
            st.divider()
            revision_text = st.text_area("Revision instructions (e.g. 'In the ## Introduction section...')")
            
            c1, c2 = st.columns(2)
            with c1:
                if st.button("✅ Approve Final Draft", type="primary"):
                    resume_run(run_id, "approve")
                    st.rerun()
            with c2:
                if st.button("✏️ Request Section Change"):
                    if revision_text.strip():
                        resume_run(run_id, "revise", instructions=revision_text.strip())
                        st.rerun()
                    else:
                        st.error("Please provide instructions first.")
                        
    elif run_data["status"] == "failed":
        st.error("The run failed.")
        st.code(run_data.get("error_message", "Unknown error"))
        
    elif run_data["status"] == "completed":
        st.success("Generation completed!")
        
        tab_plan, tab_evidence, tab_preview, tab_images = st.tabs(["🧩 Plan", "🔎 Evidence", "📝 Markdown Preview", "🖼️ Images"])
        
        with tab_plan:
            st.json(run_data.get("plan") or {})
            
        with tab_evidence:
            import pandas as pd
            ev = run_data.get("evidence") or []
            if ev:
                st.dataframe(pd.DataFrame(ev), width=1000)
            else:
                st.write("No evidence gathered.")
                
        with tab_preview:
            final_md = run_data.get("final_markdown") or ""
            if final_md:
                render_markdown_with_api_images(final_md, run_id)
                st.download_button("Download Markdown", final_md.encode("utf-8"), file_name=f"{safe_slug(run_data['topic'])}.md")
            else:
                st.write("No markdown generated.")
                
        with tab_images:
            images = run_data.get("images") or []
            if not images:
                st.write("No images generated.")
            else:
                for img in images:
                    fn = img["filename"]
                    img_url = f"{API_URL}/api/runs/{run_id}/images/{fn}"
                    resp = requests.get(img_url, headers=get_headers())
                    if resp.status_code == 200:
                        st.image(resp.content, caption=img.get("caption") or fn)
                        st.download_button(f"Download {fn}", resp.content, file_name=fn, mime="image/png")
else:
    st.info("Select a blog from the sidebar or generate a new one.")