--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.6

-- Started on 2026-03-13 15:07:27

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'WIN1252';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16389)
-- Name: branch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch (
    id integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.branch OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16388)
-- Name: branch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branch_id_seq OWNER TO postgres;

--
-- TOC entry 4960 (class 0 OID 0)
-- Dependencies: 215
-- Name: branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_id_seq OWNED BY public.branch.id;


--
-- TOC entry 224 (class 1259 OID 16443)
-- Name: comment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment (
    content character varying NOT NULL,
    is_helpful boolean NOT NULL,
    post_id integer NOT NULL,
    author_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.comment OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16442)
-- Name: comment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_id_seq OWNER TO postgres;

--
-- TOC entry 4961 (class 0 OID 0)
-- Dependencies: 223
-- Name: comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_id_seq OWNED BY public.comment.id;


--
-- TOC entry 228 (class 1259 OID 16479)
-- Name: commentupvote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commentupvote (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    voter_id integer NOT NULL
);


ALTER TABLE public.commentupvote OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16478)
-- Name: commentupvote_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.commentupvote_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.commentupvote_id_seq OWNER TO postgres;

--
-- TOC entry 4962 (class 0 OID 0)
-- Dependencies: 227
-- Name: commentupvote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.commentupvote_id_seq OWNED BY public.commentupvote.id;


--
-- TOC entry 220 (class 1259 OID 16415)
-- Name: post; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post (
    title character varying NOT NULL,
    content character varying NOT NULL,
    type character varying NOT NULL,
    author_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.post OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16414)
-- Name: post_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_id_seq OWNER TO postgres;

--
-- TOC entry 4963 (class 0 OID 0)
-- Dependencies: 219
-- Name: post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_id_seq OWNED BY public.post.id;


--
-- TOC entry 226 (class 1259 OID 16462)
-- Name: projectapplicant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projectapplicant (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.projectapplicant OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16461)
-- Name: projectapplicant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projectapplicant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projectapplicant_id_seq OWNER TO postgres;

--
-- TOC entry 4964 (class 0 OID 0)
-- Dependencies: 225
-- Name: projectapplicant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projectapplicant_id_seq OWNED BY public.projectapplicant.id;


--
-- TOC entry 222 (class 1259 OID 16429)
-- Name: rewardlog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewardlog (
    id integer NOT NULL,
    user_id integer NOT NULL,
    points integer NOT NULL,
    reason character varying NOT NULL
);


ALTER TABLE public.rewardlog OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16428)
-- Name: rewardlog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rewardlog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rewardlog_id_seq OWNER TO postgres;

--
-- TOC entry 4965 (class 0 OID 0)
-- Dependencies: 221
-- Name: rewardlog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rewardlog_id_seq OWNED BY public.rewardlog.id;


--
-- TOC entry 218 (class 1259 OID 16400)
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    email character varying NOT NULL,
    name character varying,
    picture character varying,
    branch_id integer,
    department character varying,
    graduation_year integer,
    skills character varying,
    bio character varying,
    linkedin_url character varying,
    github_url character varying,
    reward_points integer NOT NULL,
    is_first_login boolean NOT NULL,
    has_seen_welcome boolean NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16399)
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO postgres;

--
-- TOC entry 4966 (class 0 OID 0)
-- Dependencies: 217
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- TOC entry 4765 (class 2604 OID 16392)
-- Name: branch id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch ALTER COLUMN id SET DEFAULT nextval('public.branch_id_seq'::regclass);


--
-- TOC entry 4769 (class 2604 OID 16446)
-- Name: comment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment ALTER COLUMN id SET DEFAULT nextval('public.comment_id_seq'::regclass);


--
-- TOC entry 4771 (class 2604 OID 16482)
-- Name: commentupvote id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentupvote ALTER COLUMN id SET DEFAULT nextval('public.commentupvote_id_seq'::regclass);


--
-- TOC entry 4767 (class 2604 OID 16418)
-- Name: post id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post ALTER COLUMN id SET DEFAULT nextval('public.post_id_seq'::regclass);


--
-- TOC entry 4770 (class 2604 OID 16465)
-- Name: projectapplicant id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projectapplicant ALTER COLUMN id SET DEFAULT nextval('public.projectapplicant_id_seq'::regclass);


--
-- TOC entry 4768 (class 2604 OID 16432)
-- Name: rewardlog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewardlog ALTER COLUMN id SET DEFAULT nextval('public.rewardlog_id_seq'::regclass);


--
-- TOC entry 4766 (class 2604 OID 16403)
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- TOC entry 4942 (class 0 OID 16389)
-- Dependencies: 216
-- Data for Name: branch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branch (id, name) FROM stdin;
1	Computer Engineering
2	Information Technology
3	Electronics and Telecommunication
4	Mechanical Engineering
5	Civil Engineering
6	Electrical Engineering
7	Chemical Engineering
8	Automobile Engineering
9	Artificial Intelligence and Data Science
10	Artificial Intelligence and Machine Learning
11	Computer Science and Business Systems
12	Internet of Things
13	Other
\.


--
-- TOC entry 4950 (class 0 OID 16443)
-- Dependencies: 224
-- Data for Name: comment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment (content, is_helpful, post_id, author_id, created_at, id) FROM stdin;
No you should complete advance js concepts has its very useful for backend as well as frontend	f	7	7	2026-03-05 18:33:37.32086	6
you should learn advance javascript which include  topics like managing scope and execution flow, handling asynchronous operations, and leveraging functional and object-oriented programming patterns which is really beneficial and also it will help you leaning other languages very easily	f	7	9	2026-03-05 18:36:08.740605	7
\.


--
-- TOC entry 4954 (class 0 OID 16479)
-- Dependencies: 228
-- Data for Name: commentupvote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commentupvote (id, comment_id, voter_id) FROM stdin;
2	6	9
3	7	11
5	7	12
6	7	10
7	7	7
\.


--
-- TOC entry 4946 (class 0 OID 16415)
-- Dependencies: 220
-- Data for Name: post; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post (title, content, type, author_id, created_at, id) FROM stdin;
I have a doubt related Javascript	after completeing javascript basics learning advance javascript is must or should i switch to different languages	FORUM	2	2026-03-05 18:32:25.987896	7
Ai Chatbot	i want to create a ai chatbot for shopping and finding best discounts enroll if you wish to be a part of the project	LFM	2	2026-03-05 19:09:41.195661	8
\.


--
-- TOC entry 4952 (class 0 OID 16462)
-- Dependencies: 226
-- Data for Name: projectapplicant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projectapplicant (id, post_id, user_id) FROM stdin;
7	8	11
9	8	10
10	8	12
11	8	9
12	8	7
\.


--
-- TOC entry 4948 (class 0 OID 16429)
-- Dependencies: 222
-- Data for Name: rewardlog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rewardlog (id, user_id, points, reason) FROM stdin;
1	7	5	Upvote received on comment #2
2	11	5	Initial balance backfill
3	7	5	Upvote received on comment #6
4	9	5	Upvote received on comment #7
5	7	5	Upvote received on comment #6
6	9	5	Upvote received on comment #7
7	7	-5	Upvote removed from comment #6
8	9	5	Upvote received on comment #7
9	9	5	Upvote received on comment #7
\.


--
-- TOC entry 4944 (class 0 OID 16400)
-- Dependencies: 218
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (email, name, picture, branch_id, department, graduation_year, skills, bio, linkedin_url, github_url, reward_points, is_first_login, has_seen_welcome, id) FROM stdin;
ayuzcoc307@gmail.com	Viraj Parhad	https://lh3.googleusercontent.com/a/ACg8ocK7irBdMPxMnwlESPO8xfpBLijeVad8lFaxEF5rCAxh1ew_qUw=s96-c	6	BCA	2026	javascript	i want to be a coder			0	t	t	12
bhargavadage2@gmail.com	Bhargav Adage	https://lh3.googleusercontent.com/a/ACg8ocJQiMKrxS_a7UA7MBYFZb9JFCR-84XBJW8TRDE-zjlQn7XvwA=s96-c	3	AIML	2026	C# ,Javascript	i want to be a game developer			10	t	t	7
vadapaw56@gmail.com	sachin tendulkar	https://lh3.googleusercontent.com/a/ACg8ocK9WBAX1YdYqqSUXhks-X7UjW90-2hJ3dWaaT7Yqisi-WQB6l0=s96-c	10	computer science	2026	python	im a coder			0	f	t	10
ayushmith249@gmail.com	Ayush Mithabavkar	https://lh3.googleusercontent.com/a/ACg8ocIeCbXzQwhGCfa-p_Nzu61BsqZj1Cn4RxFIc9HCB5cEUIb1sZzc=s96-c	10	computer science	2026	React,Python	im a coder			0	t	t	2
avatarmeta67@gmail.com	Ashish Mehta	https://lh3.googleusercontent.com/a/ACg8ocKklFt4kzTsCI9quwOvrjUpq81xmqEoeIXIBxVVY4CTLOMjtA=s96-c	5	BCA	2026	Node,Angular,React	I'm a Frontend Developer			20	t	t	9
optional.ayu@gmail.com	gajanan rushikesh	https://lh3.googleusercontent.com/a/ACg8ocL92nA2q9UMCMDtHK_Z14z7DNiW-BftAL4aQlr2ira4vAAWLQ=s96-c	5	cs	2026	python,javascript	im a backend dev			5	t	t	11
\.


--
-- TOC entry 4967 (class 0 OID 0)
-- Dependencies: 215
-- Name: branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_id_seq', 13, true);


--
-- TOC entry 4968 (class 0 OID 0)
-- Dependencies: 223
-- Name: comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_id_seq', 7, true);


--
-- TOC entry 4969 (class 0 OID 0)
-- Dependencies: 227
-- Name: commentupvote_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.commentupvote_id_seq', 7, true);


--
-- TOC entry 4970 (class 0 OID 0)
-- Dependencies: 219
-- Name: post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_id_seq', 8, true);


--
-- TOC entry 4971 (class 0 OID 0)
-- Dependencies: 225
-- Name: projectapplicant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projectapplicant_id_seq', 12, true);


--
-- TOC entry 4972 (class 0 OID 0)
-- Dependencies: 221
-- Name: rewardlog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rewardlog_id_seq', 9, true);


--
-- TOC entry 4973 (class 0 OID 0)
-- Dependencies: 217
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 12, true);


--
-- TOC entry 4773 (class 2606 OID 16398)
-- Name: branch branch_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_name_key UNIQUE (name);


--
-- TOC entry 4775 (class 2606 OID 16396)
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (id);


--
-- TOC entry 4784 (class 2606 OID 16450)
-- Name: comment comment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_pkey PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 16484)
-- Name: commentupvote commentupvote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentupvote
    ADD CONSTRAINT commentupvote_pkey PRIMARY KEY (id);


--
-- TOC entry 4780 (class 2606 OID 16422)
-- Name: post post_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT post_pkey PRIMARY KEY (id);


--
-- TOC entry 4786 (class 2606 OID 16467)
-- Name: projectapplicant projectapplicant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projectapplicant
    ADD CONSTRAINT projectapplicant_pkey PRIMARY KEY (id);


--
-- TOC entry 4782 (class 2606 OID 16436)
-- Name: rewardlog rewardlog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewardlog
    ADD CONSTRAINT rewardlog_pkey PRIMARY KEY (id);


--
-- TOC entry 4778 (class 2606 OID 16407)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 4776 (class 1259 OID 16413)
-- Name: ix_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_user_email ON public."user" USING btree (email);


--
-- TOC entry 4792 (class 2606 OID 16456)
-- Name: comment comment_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_author_id_fkey FOREIGN KEY (author_id) REFERENCES public."user"(id);


--
-- TOC entry 4793 (class 2606 OID 16451)
-- Name: comment comment_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id);


--
-- TOC entry 4796 (class 2606 OID 16485)
-- Name: commentupvote commentupvote_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentupvote
    ADD CONSTRAINT commentupvote_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comment(id);


--
-- TOC entry 4797 (class 2606 OID 16490)
-- Name: commentupvote commentupvote_voter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentupvote
    ADD CONSTRAINT commentupvote_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public."user"(id);


--
-- TOC entry 4790 (class 2606 OID 16423)
-- Name: post post_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT post_author_id_fkey FOREIGN KEY (author_id) REFERENCES public."user"(id);


--
-- TOC entry 4794 (class 2606 OID 16468)
-- Name: projectapplicant projectapplicant_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projectapplicant
    ADD CONSTRAINT projectapplicant_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id);


--
-- TOC entry 4795 (class 2606 OID 16473)
-- Name: projectapplicant projectapplicant_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projectapplicant
    ADD CONSTRAINT projectapplicant_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- TOC entry 4791 (class 2606 OID 16437)
-- Name: rewardlog rewardlog_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewardlog
    ADD CONSTRAINT rewardlog_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- TOC entry 4789 (class 2606 OID 16408)
-- Name: user user_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id);


-- Completed on 2026-03-13 15:07:28

--
-- PostgreSQL database dump complete
--

