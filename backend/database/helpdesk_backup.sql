--
-- PostgreSQL database dump
--

\restrict JuKy4iW0aejfNF8V9dAtMtl9GlVpecIlMAqLfgWsRkncO0st3Lx3AjHDyx1EEaR

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: TicketCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketCategory" AS ENUM (
    'GENERAL_QUESTION',
    'TECHNICAL_QUESTION',
    'REFUND_REQUEST'
);


ALTER TYPE public."TicketCategory" OWNER TO postgres;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'AGENT'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp(3) without time zone,
    "refreshTokenExpiresAt" timestamp(3) without time zone,
    scope text,
    password text,
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.account OWNER TO postgres;

--
-- Name: reply; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reply (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "authorId" text,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "fromEmail" text,
    "bodyHtml" text
);


ALTER TABLE public.reply OWNER TO postgres;

--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket (
    id text NOT NULL,
    "fromEmail" text NOT NULL,
    "toEmail" text,
    subject text NOT NULL,
    body text NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    category public."TicketCategory",
    summary text,
    "agentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bodyHtml" text
);


ALTER TABLE public.ticket OWNER TO postgres;

--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    role public."UserRole" DEFAULT 'AGENT'::public."UserRole" NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: verification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone
);


ALTER TABLE public.verification OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
16856878-ca5a-4cc6-95d5-67824f98e562	173cd376e83bfee4398a609edfc093f250d8f83b5a91ed6e789d5be09e77b9f0	2026-05-12 19:26:29.343951+05:30	20260426100211_init	\N	\N	2026-05-12 19:26:29.250849+05:30	1
71bb3131-0b52-4188-985c-a31055abb271	4597fde3d9ffdee13607ce5ee7126ac10be663c5b36212914547396cd80782ae	2026-05-12 19:26:29.409699+05:30	20260427043939_add_better_auth_schema	\N	\N	2026-05-12 19:26:29.344683+05:30	1
fb0c55b4-1843-4373-a60d-808045b056ed	577bd40d4f6ebfd110fb7d760002e480ae88bf9e8e929f51c045676eaf8cb707	2026-05-12 19:26:29.418589+05:30	20260428024814_drop_ticket_reply	\N	\N	2026-05-12 19:26:29.4103+05:30	1
19f11898-2fde-4791-8b6d-41786fcfacf4	7896918b4e275e8eac3a44ada4ecc95569d333f5d0b01ba1968d14b2eb0b808b	2026-05-13 04:06:03.976543+05:30	20260512223603_add_deleted_at_to_user	\N	\N	2026-05-13 04:06:03.972381+05:30	1
d68b2cc8-82cc-4303-85de-16f2bf60af0f	76b028318a16020a6f0531a1817688d69227ccb4e6d0f720f8f4643e9199bd67	2026-05-14 01:43:36.119416+05:30	20260513201336_add_ticket_model	\N	\N	2026-05-14 01:43:36.078444+05:30	1
fe3c96ea-d470-4be1-9936-218a061fbbe6	80d24c980a4561c5568c9e792a5d386ae4b590fc5e1e4a75ba706ddf0e0c3735	2026-05-14 02:07:58.00642+05:30	20260513203757_add_ticket_body_html	\N	\N	2026-05-14 02:07:58.002725+05:30	1
0f5c54e4-1051-4abe-a12a-54049aefce32	4f532d5ad9947c6ca00ab9bd212aeb9db606a3631d3fc3b80e45bc7ed1aa43fd	2026-05-15 02:23:59.908437+05:30	20260514205359_add_reply_model	\N	\N	2026-05-15 02:23:59.695539+05:30	1
cb3683fd-ec57-4019-b66c-c0fbd267dc58	33cda6611e6b4459d462683a2f7e64df0aae2fb254b1fc98f1a0399fe6dac327	2026-05-15 02:34:03.227379+05:30	20260514210403_make_reply_author_nullable	\N	\N	2026-05-15 02:34:03.218737+05:30	1
2f5b1850-11ec-490a-88b5-298b164a8703	4638b25382112019f9d9a5b58ec9e6913d73a7f189b0f6568327ddea4e89dfaf	2026-05-15 14:42:14.775478+05:30	20260515091214_add_reply_body_html	\N	\N	2026-05-15 14:42:14.771675+05:30	1
\.


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
54CWzndsAfLjGDv8Yjmqdh9JcKK13iO9	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT	credential	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT	\N	\N	\N	\N	\N	\N	c21bbda8d3d0eedb50ed7ecaaafa1183:478d9cdf1b6320b5104a250f232991ffde939b7d08c2ab4d54315243142eaf46ebca873c481dc1649f69da4c6ecc33aee85c90c87cba1dfd80f027dba7fb9183	2026-05-12 14:04:22.535	2026-05-12 14:04:22.535
xc06WJuwaKHz9rWnNZtViKVaZj4WDbHI	NLCdvZfAi8UNy8P9D2ViayDz7GJDtB2P	credential	NLCdvZfAi8UNy8P9D2ViayDz7GJDtB2P	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:10.729	2026-05-14 00:38:10.729
NYcEkjPzYCA9whDz8x6So6P8R11veuXa	vQJEI7cUHBs60fuKHWTwwLoOAAIK7aG2	credential	vQJEI7cUHBs60fuKHWTwwLoOAAIK7aG2	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:10.788	2026-05-14 00:38:10.788
WODONN0EltJlCfbIL1XYPmbJlqlNnpNF	NSp1uEHUQTgSoNURF4MGwuMJqTG44IpO	credential	NSp1uEHUQTgSoNURF4MGwuMJqTG44IpO	\N	\N	\N	\N	\N	\N	ab8627d7a05855601f9852bad9789870:57d0c41e73d85a67b6fee271c074f197654f3f841460e5de74579e9a7f524061131ad4207baf734215965034d1d29e6b69bc187d7917330f869bb37df1c62a72	2026-05-12 22:13:58.674	2026-05-12 22:13:58.674
NYfygZyNmOU1M1NdoDYBBNzcaX7r85YJ	iLkZ2GfuFbbCIwDeeW8dts953ksW13kn	credential	iLkZ2GfuFbbCIwDeeW8dts953ksW13kn	\N	\N	\N	\N	\N	\N	458612756a427cae17efdcc28460434d:e1c79354c56c10d7a23a39c9cbbcb4c4c9e4d66a91e9cd97717b1bb90fa5cd6644493c3477a619d72d994e2f10c3563c681f228b4843db04f7e49cff6f6a8a83	2026-05-12 23:55:47.576	2026-05-12 23:55:47.576
SetgHCIsu2Xr6xEQpoE2Gvr1bzchjp9E	uBY4YyxxxQL53ktyxVs1c16vmbejzUCb	credential	uBY4YyxxxQL53ktyxVs1c16vmbejzUCb	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:10.845	2026-05-14 00:38:10.845
QAxi9uhFNMMx4eAY7TynWVT5I7OYUQmv	MP62ksiqVECdhZY8tPlnEq0wFxqCZ9IS	credential	MP62ksiqVECdhZY8tPlnEq0wFxqCZ9IS	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:10.903	2026-05-14 00:38:10.903
pZd7pe5ZNP4SH0Fm4TqmMWWgFmVBNR5N	XItPDS0D2lH00m7U8i6cc8jZjgK1hNpM	credential	XItPDS0D2lH00m7U8i6cc8jZjgK1hNpM	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:10.961	2026-05-14 00:38:10.961
3aMoCKt51vl7aYH8tJZwCPojQVFLE3l0	gMYeiKQgBiEa5HYotOr68iXmnESzfVLG	credential	gMYeiKQgBiEa5HYotOr68iXmnESzfVLG	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.017	2026-05-14 00:38:11.017
ruPzybCvvPs74KFop3RwGNkeyDAs5YC1	PYHZiclmO8SqAeetjuhhL28QROnkIrcM	credential	PYHZiclmO8SqAeetjuhhL28QROnkIrcM	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.074	2026-05-14 00:38:11.074
y5J8jqsVA0PrZ1XAxFhoEVYtcEBO28GJ	7a9Wu1zSuKs12ShQnphyq0tdbjdtMXAu	credential	7a9Wu1zSuKs12ShQnphyq0tdbjdtMXAu	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.13	2026-05-14 00:38:11.13
o9dsmgIuMdwSDUoNUIXIDJK8eGJJUdZG	Kfqz844hruFF6DZccoPqmNDahWPtJDoc	credential	Kfqz844hruFF6DZccoPqmNDahWPtJDoc	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.186	2026-05-14 00:38:11.186
MnY5D0tdvfmw6s3kQZXhsFTzFmJovL8J	awucGF6KKHyF9kQgZIozR8z1G6gXzKmo	credential	awucGF6KKHyF9kQgZIozR8z1G6gXzKmo	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.242	2026-05-14 00:38:11.242
hxCDBL79RsBsqwSGlwBODhdp20ELwk7J	YBI8TTcDMp24YUMoM1HOJy7RQlG51PJK	credential	YBI8TTcDMp24YUMoM1HOJy7RQlG51PJK	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.298	2026-05-14 00:38:11.298
Ig83tBpQnY7fdRPk6Qc02djKw5uzK76S	uFaE10wzEWnLxvkgwYrVPjqkL2KXoK19	credential	uFaE10wzEWnLxvkgwYrVPjqkL2KXoK19	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.354	2026-05-14 00:38:11.354
wGXwmmLZTwpA2wlqDOsR1vJ7eBMhpMyz	ykMq8JQMSYBFCo7sNzpJqfPnivFko18T	credential	ykMq8JQMSYBFCo7sNzpJqfPnivFko18T	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.408	2026-05-14 00:38:11.408
XdHz1EF1GpQvSgVALerublUxplYuFg8C	bHk1xGoFw6p0dJaOipzjNuIZEvkZQaRi	credential	bHk1xGoFw6p0dJaOipzjNuIZEvkZQaRi	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.464	2026-05-14 00:38:11.464
ur8vW8nwoo8i8I43023ABau6X9X3zgBi	KneMcyf79jg1lvkX4RsWNGqwFNHoJc6P	credential	KneMcyf79jg1lvkX4RsWNGqwFNHoJc6P	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.526	2026-05-14 00:38:11.526
76A60u5DKFyptawhGdmLitw5sCQ7Cr0a	8umVCkgLpRvAS39MCgTNNeORDUngfKQw	credential	8umVCkgLpRvAS39MCgTNNeORDUngfKQw	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.636	2026-05-14 00:38:11.636
3o9J1uu1bN026w13kV7CypQsEjwrxHI5	JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi	credential	JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.692	2026-05-14 00:38:11.692
P4reAlrF3PuPNVzBkF687rXNoftMKJMc	IDkE5Q6AVNe1sjpEfqnbf3o3rPmrbjQl	credential	IDkE5Q6AVNe1sjpEfqnbf3o3rPmrbjQl	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.746	2026-05-14 00:38:11.746
Na3SHHGeW71Xch8dRbRMjFTUxL9m94Jt	NtDkCPTPED7XRdnuiBqwaHRRBZdi2d4C	credential	NtDkCPTPED7XRdnuiBqwaHRRBZdi2d4C	\N	\N	\N	\N	\N	\N	707eb9f6290a615df264607f5b1ce4d4:d865841be205f9c1e0316fdec262f462732b2866dd98e482a14874e098ccf52d6e33b248ac660688b7c93352788b8c888bbe5a8e1a69ff7aef982a0c24a3e3d8	2026-05-14 00:38:11.801	2026-05-14 00:38:11.801
bxkpOWJQs3kb3c9IFp45IbdqyaLPo8YE	1kTeZJlEdgi2lWEg8VKmaIfOHA6m6VkW	credential	1kTeZJlEdgi2lWEg8VKmaIfOHA6m6VkW	\N	\N	\N	\N	\N	\N	8a71ab705f9b07b2815be6c52ec76406:48be0c20c4f24b9c232a3e66829507ccfe08ec8a3574b5425420fd2d96323ea609b5d8666b83642e7c89b670549fbaa6eb00051cb4eed9caa3b02242054a3e8a	2026-05-15 07:24:16.308	2026-05-15 07:24:16.308
\.


--
-- Data for Name: reply; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reply (id, "ticketId", "authorId", body, "createdAt", "fromEmail", "bodyHtml") FROM stdin;
cmp5z48ao0000m4qlyqb6m8ep	cmp4izw0g0000ozqlg5q715jg	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT	We are working on the issue. The status will be updated soon.	2026-05-14 21:01:23.328	\N	\N
cmp5zbwb50000tvqlcb5j2fxd	cmp4izw0g0000ozqlg5q715jg	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT	The tickets is assigned to our agent Eva. She will look into the issue soon.	2026-05-14 21:07:21.041	\N	\N
cmp60hmvh0000ccqlej28uc18	cmp4izw0g0000ozqlg5q715jg	\N	Hi, I still haven't received my refund for order 4821. It has been over a week now. Can you please check the status and let me know when I can expect the funds to be returned to my account? Thank you.	2026-05-14 21:39:48.365	bob@example.com	\N
cmp6pzsbr0000t7qlmrcd22e8	cmp4izw0g0000ozqlg5q715jg	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT	Test reply	2026-05-15 09:33:45.639	\N	\N
cmp6q2a2t0000wvqlmwbmcn8k	cmp4izw0g0000ozqlg5q715jg	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT	Fixed reply test	2026-05-15 09:35:41.957	\N	\N
cmp6x0nlz0000o2ql2e6617jx	cmp4izw0g0000ozqlg5q715jg	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT	We are investigating a refund for order 4821 due to damaged goods. We apologize for the inconvenience this has caused and appreciate your patience as we work on resolving this issue. \n\nPlease be assured that our priority is to return the full value of your order, and we will provide you with an update once the status changes.	2026-05-15 12:50:23.496	\N	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId") FROM stdin;
OG6Tigp3U5jJuRiANeeYHLOaJheMbDQF	2026-05-19 14:04:22.54	Owdru84cAGjByvq2xt9SIqR15Fgd8KPK	2026-05-12 14:04:22.54	2026-05-12 14:04:22.54			7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT
m380kfp7o0ydqbNT2YacHIvxlVnOL8mu	2026-05-20 22:29:40.207	emXMvaDLRjoQYm7eocr4yCuKqmf043yi	2026-05-13 22:29:40.207	2026-05-13 22:29:40.207		curl/8.7.1	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT
gCz1hvixwKBEHgLltIzng53VgXTHnvsz	2026-05-20 23:34:03.401	DSk8uORc34j3FyINukWIgGDfxCQoOsGY	2026-05-13 23:34:03.401	2026-05-13 23:34:03.401		curl/8.7.1	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT
j6L624PVG6SCQSHlOHozVLRNIgmFV1ln	2026-05-21 00:38:10.73	YdvX90tXBiYGc0R0bwYgCr6ogwm2BUwM	2026-05-14 00:38:10.73	2026-05-14 00:38:10.73			NLCdvZfAi8UNy8P9D2ViayDz7GJDtB2P
jVbmWCFYkDYuLeSY3tFTiKljNjbKrZIv	2026-05-21 00:38:10.789	IfKuaMR1JezXMY50nwjlF7sIniiARE9i	2026-05-14 00:38:10.789	2026-05-14 00:38:10.789			vQJEI7cUHBs60fuKHWTwwLoOAAIK7aG2
6DUNWyTBbb1uhCw8t1sdpcMFYZWmIMwG	2026-05-21 00:38:10.846	o77XMDCDkL3QmGOxnuu4wmFIzCPXe5mr	2026-05-14 00:38:10.846	2026-05-14 00:38:10.846			uBY4YyxxxQL53ktyxVs1c16vmbejzUCb
AuMuDKrsax855ci1Bz6zkP8VadapD8ei	2026-05-21 00:38:10.904	oA7aRAMEiXVfgiKE0MIkf7nn1MucLYCq	2026-05-14 00:38:10.904	2026-05-14 00:38:10.904			MP62ksiqVECdhZY8tPlnEq0wFxqCZ9IS
jbLJeDoj6FPH9AxuyyTZ5wDo8E0yt1ha	2026-05-21 00:38:10.962	Swynas4IEBud5sbZgCNyEzUCdzlgFpUw	2026-05-14 00:38:10.962	2026-05-14 00:38:10.962			XItPDS0D2lH00m7U8i6cc8jZjgK1hNpM
yXLdxnocEQXf6GHq6FFDlc9NpJ1Ur9ZH	2026-05-21 00:38:11.019	TeaTg7ZZ4t9kkRJuGPjlW8bnT78ezvSv	2026-05-14 00:38:11.019	2026-05-14 00:38:11.019			gMYeiKQgBiEa5HYotOr68iXmnESzfVLG
iWlabfuAGYzfMAf0PnlxIo8er7mVzP9n	2026-05-21 00:38:11.075	OLoI9VpWATVhxICtQH0GjQXaMO0l99VE	2026-05-14 00:38:11.075	2026-05-14 00:38:11.075			PYHZiclmO8SqAeetjuhhL28QROnkIrcM
LuDgZtyZQSZJLtKIA0Rzdjh3p945X7jc	2026-05-21 00:38:11.131	P6cs0VJuJT7qZdbpLjKvr9C48dNJUeHr	2026-05-14 00:38:11.131	2026-05-14 00:38:11.131			7a9Wu1zSuKs12ShQnphyq0tdbjdtMXAu
2uZzuF32neU9PkGW0AB3erpRHo6wA4pZ	2026-05-21 00:38:11.188	7RNdiaBKWylZcFP7I8fzpox6YezkrZYJ	2026-05-14 00:38:11.188	2026-05-14 00:38:11.188			Kfqz844hruFF6DZccoPqmNDahWPtJDoc
O5KhaiZPZeeUp3R9ZsW66nJeorUVZnwG	2026-05-21 00:38:11.243	kRiJoAm5Xi57vZbbwHDaumVDxPH68fAx	2026-05-14 00:38:11.243	2026-05-14 00:38:11.243			awucGF6KKHyF9kQgZIozR8z1G6gXzKmo
XcZUKjoM53TkrQsWenZfeZ26CR48MsgS	2026-05-21 00:38:11.299	B8uFfd2FUeYLDLfzSegBrh8kkqxjZdC6	2026-05-14 00:38:11.299	2026-05-14 00:38:11.299			YBI8TTcDMp24YUMoM1HOJy7RQlG51PJK
JPODHa1apbs2cWkswM5RXzVtysuJJofp	2026-05-21 00:38:11.355	ZqUMSoxtkgqpXm4ovTbdvprbJxKA96Sr	2026-05-14 00:38:11.355	2026-05-14 00:38:11.355			uFaE10wzEWnLxvkgwYrVPjqkL2KXoK19
urAsYBWvoaEl15S2l59DxTEXh4rD0gxF	2026-05-21 00:38:11.409	WSeEoe0ibm8Z9vy5NRgcbxLbXUJ6RiUA	2026-05-14 00:38:11.409	2026-05-14 00:38:11.409			ykMq8JQMSYBFCo7sNzpJqfPnivFko18T
3gV3nLkf23WCognBa2AqjfUjNoTJ1Uho	2026-05-21 00:38:11.467	4GTQQcjnYhQCoifM8ltL4D4b5OIg6bxM	2026-05-14 00:38:11.467	2026-05-14 00:38:11.467			bHk1xGoFw6p0dJaOipzjNuIZEvkZQaRi
7bNGK1GPHQavU1ehxITC16oDURIhkkPJ	2026-05-21 00:38:11.527	muZh7DzvPRz4IJIHdYhyxrsLEE1GWWFW	2026-05-14 00:38:11.527	2026-05-14 00:38:11.527			KneMcyf79jg1lvkX4RsWNGqwFNHoJc6P
HNZLGjsPmfxzRv4m08ZYolqRDttwneYC	2026-05-21 00:38:11.637	4OcyF1Z1h1j7NMJR3Lvhc04ltxKUoeuG	2026-05-14 00:38:11.637	2026-05-14 00:38:11.637			8umVCkgLpRvAS39MCgTNNeORDUngfKQw
OOON1nn4XWrIPUptODGZ8eX7oOWrOps0	2026-05-21 00:38:11.692	jWDXxQHE4OC6J1dKPkixPRJANqzUvudP	2026-05-14 00:38:11.692	2026-05-14 00:38:11.692			JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi
WbaimjxQvbdrTOYtXKhBGocKcxCq3X8U	2026-05-21 00:38:11.747	VYePelhrKWrzag8S9FgtCSPqD3NK2Wn7	2026-05-14 00:38:11.747	2026-05-14 00:38:11.747			IDkE5Q6AVNe1sjpEfqnbf3o3rPmrbjQl
n0IlK80EvCvpv2vCOe2G8qrpwT2i2EOw	2026-05-21 00:38:11.802	rKpRpMYxi3Q6bT8WBnfG2azPQ181ZJ3Q	2026-05-14 00:38:11.802	2026-05-14 00:38:11.802			NtDkCPTPED7XRdnuiBqwaHRRBZdi2d4C
9cFgbxsQ8nEoFymxPjZeq3VUW74sbygv	2026-05-21 23:01:45.953	nQBhQWYarCLzEhzlprN9LSJ9tRDUCH7C	2026-05-12 22:44:05.668	2026-05-14 23:01:45.953		Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT
7RJWp6EdHemsum4o9xOaJzByN62GTHPX	2026-05-22 09:33:45.543	f4GWPWloGXbhkFn2Rsu9UX1rtYTAyCns	2026-05-15 09:33:45.543	2026-05-15 09:33:45.543		curl/8.7.1	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT
gbFxRBurFElZVh5WOvQeXQM3a0NI6WBe	2026-05-22 09:34:51.478	fg4DUKWaZSgpXHFGVGYI7yu57Hd6sMoy	2026-05-15 09:34:51.478	2026-05-15 09:34:51.478		curl/8.7.1	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT
uafzTB6uILmsnFND3Yet5Exo8y1nHuGj	2026-05-22 09:35:41.867	JzmtuG3PAkVAU5PlOU5z9wCjg1uyRdgD	2026-05-15 09:35:41.867	2026-05-15 09:35:41.867		curl/8.7.1	7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT
\.


--
-- Data for Name: ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket (id, "fromEmail", "toEmail", subject, body, status, category, summary, "agentId", "createdAt", "updatedAt", "bodyHtml") FROM stdin;
cmp4i94xc00003xql7tgiy77n	john@example.com	support@helpdesk.com	I need help with my order	Hello, I placed an order and need help.	OPEN	\N	\N	\N	2026-05-13 20:21:32.593	2026-05-13 20:21:32.593	\N
cmp4i9iy700013xqleagck4z1	jane@example.com	\N	Refund request	I want a refund for my purchase.	OPEN	\N	\N	\N	2026-05-13 20:21:50.767	2026-05-13 20:21:50.767	\N
cmp4mnbvz0000tcqlr0gu04k7	hank1@icloud.com	support@helpdesk.example.com	Unable to log in to my account	Hi, I'm writing in about: Unable to log in to my account. Please help me resolve this as soon as possible. Thanks!	OPEN	TECHNICAL_QUESTION	\N	\N	2026-04-15 07:42:47.938	2026-05-13 22:24:33.263	\N
cmp4mnbvz0001tcql3fgz774u	dylan2@yahoo.com	support@helpdesk.example.com	Billing charge I don't recognise	Hi, I'm writing in about: Billing charge I don't recognise. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-03-01 20:03:05.052	2026-05-13 22:24:33.263	\N
cmp4mnbvz0005tcqlekvncefq	liam6@freelancer.net	support@helpdesk.example.com	Password reset email not arriving	Hi, I'm writing in about: Password reset email not arriving. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-03-20 16:45:36.748	2026-05-13 22:24:33.263	\N
cmp4mnbvz0008tcql52ccy2xt	clara9@techcorp.dev	support@helpdesk.example.com	How do I add a team member?	Hi, I'm writing in about: How do I add a team member?. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-03-14 21:25:55.066	2026-05-13 22:24:33.263	\N
cmp4mnbvz0009tcqlas530hzr	wendy10@freelancer.net	support@helpdesk.example.com	Invoice missing company name	Hi, I'm writing in about: Invoice missing company name. Please help me resolve this as soon as possible. Thanks!	OPEN	TECHNICAL_QUESTION	\N	\N	2026-04-06 00:04:39.447	2026-05-13 22:24:33.263	\N
cmp4mnbvz000btcql7u9q6ovw	bob12@bigenterprise.org	support@helpdesk.example.com	API rate limit hit unexpectedly	Hi, I'm writing in about: API rate limit hit unexpectedly. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-04-10 19:07:54.543	2026-05-13 22:24:33.263	\N
cmp4mnbvz000etcqluhykjj34	ben15@yahoo.com	support@helpdesk.example.com	Webhook not firing on ticket close	Hi, I'm writing in about: Webhook not firing on ticket close. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-04-19 09:38:50.806	2026-05-13 22:24:33.263	\N
cmp4mnbvz000itcql59iujequ	grace19@outlook.com	support@helpdesk.example.com	Search results returning incorrect data	Hi, I'm writing in about: Search results returning incorrect data. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-03-29 05:31:10.614	2026-05-13 22:24:33.263	\N
cmp4mnbvz000ktcql5hsu3142	rachel21@proton.me	support@helpdesk.example.com	Data import failed with CSV error	Hi, I'm writing in about: Data import failed with CSV error. Please help me resolve this as soon as possible. Thanks!	OPEN	\N	\N	\N	2026-02-18 22:22:15.639	2026-05-13 22:24:33.263	\N
cmp4mnbvz000ltcql2oxu3dki	bob22@icloud.com	support@helpdesk.example.com	How do I delete my account?	Hi, I'm writing in about: How do I delete my account?. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-02-19 19:56:27.618	2026-05-13 22:24:33.263	\N
cmp4mnbvz0002tcqlq6457hh4	anna3@gmail.com	support@helpdesk.example.com	How do I export my data?	Hi, I'm writing in about: How do I export my data?. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	NSp1uEHUQTgSoNURF4MGwuMJqTG44IpO	2026-05-03 11:13:34.775	2026-05-14 00:44:43.391	\N
cmp4mnbvz0003tcqlotqvczwd	alice4@yahoo.com	support@helpdesk.example.com	Feature request: dark mode	Hi, I'm writing in about: Feature request: dark mode. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	u3GkUyr5uk10JGlNPsIybLByKGTfwB0U	2026-03-17 16:13:08.148	2026-05-14 00:44:43.397	\N
cmp4mnbvz0004tcqltjj7q9kc	pete5@outlook.com	support@helpdesk.example.com	App crashes on startup	Hi, I'm writing in about: App crashes on startup. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	XItPDS0D2lH00m7U8i6cc8jZjgK1hNpM	2026-04-09 22:29:47.094	2026-05-14 00:44:43.398	\N
cmp4mnbvz0006tcql3m2g2k8a	carol7@proton.me	support@helpdesk.example.com	Refund request for duplicate order	Hi, I'm writing in about: Refund request for duplicate order. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	IDkE5Q6AVNe1sjpEfqnbf3o3rPmrbjQl	2026-02-18 07:28:45.036	2026-05-14 00:44:43.399	\N
cmp4mnbvz000atcqludmrw535	dylan11@icloud.com	support@helpdesk.example.com	Two-factor authentication not working	Hi, I'm writing in about: Two-factor authentication not working. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	u3GkUyr5uk10JGlNPsIybLByKGTfwB0U	2026-03-27 13:19:19.293	2026-05-14 00:44:43.408	\N
cmp4mnbvz000ctcqliftjlcff	alice13@acme.io	support@helpdesk.example.com	Wrong currency shown on checkout	Hi, I'm writing in about: Wrong currency shown on checkout. Please help me resolve this as soon as possible. Thanks!	RESOLVED	REFUND_REQUEST	\N	7a9Wu1zSuKs12ShQnphyq0tdbjdtMXAu	2026-04-21 17:59:45.086	2026-05-14 00:44:43.409	\N
cmp4mnbvz000dtcqlw9t3f630	pete14@startupco.com	support@helpdesk.example.com	Can I upgrade mid-cycle?	Hi, I'm writing in about: Can I upgrade mid-cycle?. Please help me resolve this as soon as possible. Thanks!	RESOLVED	GENERAL_QUESTION	\N	XItPDS0D2lH00m7U8i6cc8jZjgK1hNpM	2026-02-23 10:16:24.106	2026-05-14 00:44:43.41	\N
cmp4mnbvz000ftcql5ogpcvzg	sam16@outlook.com	support@helpdesk.example.com	Mobile app freezes on iOS 17	Hi, I'm writing in about: Mobile app freezes on iOS 17. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	5lQQFlgT46Z6CR6vJh6X7lrQRrygGxOe	2026-05-09 16:30:32.397	2026-05-14 00:44:43.411	\N
cmp4mnbvz000gtcql4s2ahv3u	uma17@bigenterprise.org	support@helpdesk.example.com	How do I change my email address?	Hi, I'm writing in about: How do I change my email address?. Please help me resolve this as soon as possible. Thanks!	CLOSED	\N	\N	uBY4YyxxxQL53ktyxVs1c16vmbejzUCb	2026-03-30 20:40:10.558	2026-05-14 00:44:43.412	\N
cmp4mnbvz000htcql6zl98cw2	ben18@techcorp.dev	support@helpdesk.example.com	Subscription cancelled but still charged	Hi, I'm writing in about: Subscription cancelled but still charged. Please help me resolve this as soon as possible. Thanks!	RESOLVED	REFUND_REQUEST	\N	Kfqz844hruFF6DZccoPqmNDahWPtJDoc	2026-02-20 14:20:09.199	2026-05-14 00:44:43.413	\N
cmp4mnbvz000jtcqllhhj61wf	mia20@techcorp.dev	support@helpdesk.example.com	SSO setup assistance needed	Hi, I'm writing in about: SSO setup assistance needed. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi	2026-04-12 14:57:05.028	2026-05-14 00:44:43.414	\N
cmp4mnbvz000ntcqlules2yl2	yara24@freelancer.net	support@helpdesk.example.com	Discount code not applying	Hi, I'm writing in about: Discount code not applying. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	uFaE10wzEWnLxvkgwYrVPjqkL2KXoK19	2026-03-25 14:39:58.281	2026-05-14 00:44:43.416	\N
cmp4mnbvz000otcql9av3xgr2	dylan25@proton.me	support@helpdesk.example.com	Report shows wrong date range	Hi, I'm writing in about: Report shows wrong date range. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	Kfqz844hruFF6DZccoPqmNDahWPtJDoc	2026-05-08 11:05:17.99	2026-05-14 00:44:43.417	\N
cmp4izw0g0000ozqlg5q715jg	bob@example.com	support@helpdesk.com	Request a refund for order 4821	Hello, I would like a refund for order 4821. It arrived damaged.	OPEN	\N	\N	XItPDS0D2lH00m7U8i6cc8jZjgK1hNpM	2026-05-13 20:42:20.752	2026-05-14 21:06:40.833	\N
cmp4mnbvz000rtcqlnam99s1o	liam28@proton.me	support@helpdesk.example.com	Bulk ticket assignment not working	Hi, I'm writing in about: Bulk ticket assignment not working. Please help me resolve this as soon as possible. Thanks!	OPEN	\N	\N	\N	2026-02-16 06:52:30.34	2026-05-13 22:24:33.263	\N
cmp4mnbvz000stcqlh2cwbdva	jack29@gmail.com	support@helpdesk.example.com	How do I set business hours?	Hi, I'm writing in about: How do I set business hours?. Please help me resolve this as soon as possible. Thanks!	OPEN	\N	\N	\N	2026-03-23 15:45:36.162	2026-05-13 22:24:33.263	\N
cmp4mnbvz000ttcql5psr9dh0	bob30@outlook.com	support@helpdesk.example.com	Agent stats missing from dashboard	Hi, I'm writing in about: Agent stats missing from dashboard. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-05-01 08:52:03.285	2026-05-13 22:24:33.263	\N
cmp4mnbvz000xtcqlg7qpr7hb	zane34@acme.io	support@helpdesk.example.com	How do I archive old tickets?	Hi, I'm writing in about: How do I archive old tickets?. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-04-27 15:58:02.051	2026-05-13 22:24:33.263	\N
cmp4mnbvz000ytcqlbbe1ir1y	jack35@proton.me	support@helpdesk.example.com	SLA timer not pausing on hold	Hi, I'm writing in about: SLA timer not pausing on hold. Please help me resolve this as soon as possible. Thanks!	OPEN	TECHNICAL_QUESTION	\N	\N	2026-03-08 20:52:52.974	2026-05-13 22:24:33.263	\N
cmp4mnbvz000ztcqlpleaqvv9	david36@freelancer.net	support@helpdesk.example.com	Widget not loading on Safari	Hi, I'm writing in about: Widget not loading on Safari. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-03-08 20:53:20.147	2026-05-13 22:24:33.263	\N
cmp4mnbvz0010tcql88kad4s3	anna37@yahoo.com	support@helpdesk.example.com	How do I CC a customer on a reply?	Hi, I'm writing in about: How do I CC a customer on a reply?. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-02-13 12:35:44.806	2026-05-13 22:24:33.263	\N
cmp4mnbvz0012tcqls5h4qele	zane39@proton.me	support@helpdesk.example.com	Custom field values not saving	Hi, I'm writing in about: Custom field values not saving. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-03-22 13:36:58.203	2026-05-13 22:24:33.263	\N
cmp4mnbvz0015tcqlkqwqnsp4	tina42@gmail.com	support@helpdesk.example.com	Canned responses not appearing	Hi, I'm writing in about: Canned responses not appearing. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-03-22 23:08:17.096	2026-05-13 22:24:33.263	\N
cmp4mnbvz0018tcqlva6jiyqe	xander45@techcorp.dev	support@helpdesk.example.com	How do I set up auto-close?	Hi, I'm writing in about: How do I set up auto-close?. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-02-26 19:02:01.984	2026-05-13 22:24:33.263	\N
cmp4mnbvz001atcqlzk2737ts	wendy47@yahoo.com	support@helpdesk.example.com	Report export takes too long	Hi, I'm writing in about: Report export takes too long. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-03-18 05:52:39.591	2026-05-13 22:24:33.263	\N
cmp4mnbvz001ctcqloauw3fl3	victor49@bigenterprise.org	support@helpdesk.example.com	Tags not syncing across agents	Hi, I'm writing in about: Tags not syncing across agents. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-03-19 02:40:38.894	2026-05-13 22:24:33.263	\N
cmp4mnbvz001etcqlrx17glol	noah51@bigenterprise.org	support@helpdesk.example.com	Unable to log in to my account (#2)	Hi, I'm writing in about: Unable to log in to my account. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-03-05 16:43:01.538	2026-05-13 22:24:33.263	\N
cmp4mnbvz000qtcqltw8fbtb2	grace27@bigenterprise.org	support@helpdesk.example.com	Audit log not showing recent changes	Hi, I'm writing in about: Audit log not showing recent changes. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	uFaE10wzEWnLxvkgwYrVPjqkL2KXoK19	2026-03-22 02:25:56.755	2026-05-14 00:44:43.418	\N
cmp4mnbvz000utcqlo81ggvp0	quinn31@bigenterprise.org	support@helpdesk.example.com	Auto-reply not sending	Hi, I'm writing in about: Auto-reply not sending. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	gMYeiKQgBiEa5HYotOr68iXmnESzfVLG	2026-03-02 06:36:54.86	2026-05-14 00:44:43.419	\N
cmp4mnbvz000vtcqllfzaos69	wendy32@bigenterprise.org	support@helpdesk.example.com	GDPR data export request	Hi, I'm writing in about: GDPR data export request. Please help me resolve this as soon as possible. Thanks!	RESOLVED	GENERAL_QUESTION	\N	NLCdvZfAi8UNy8P9D2ViayDz7GJDtB2P	2026-03-01 08:50:26.452	2026-05-14 00:44:43.42	\N
cmp4mnbvz000wtcqlmeru2k5k	clara33@bigenterprise.org	support@helpdesk.example.com	Payment method update failed	Hi, I'm writing in about: Payment method update failed. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	5lQQFlgT46Z6CR6vJh6X7lrQRrygGxOe	2026-03-20 20:52:55.758	2026-05-14 00:44:43.42	\N
cmp4mnbvz0011tcql6kr30l8g	wendy38@bigenterprise.org	support@helpdesk.example.com	Duplicate tickets being created	Hi, I'm writing in about: Duplicate tickets being created. Please help me resolve this as soon as possible. Thanks!	RESOLVED	\N	\N	MP62ksiqVECdhZY8tPlnEq0wFxqCZ9IS	2026-04-20 01:55:12.224	2026-05-14 00:44:43.421	\N
cmp4mnbvz0014tcqlc0cs49dx	olivia41@acme.io	support@helpdesk.example.com	How do I merge tickets?	Hi, I'm writing in about: How do I merge tickets?. Please help me resolve this as soon as possible. Thanks!	RESOLVED	REFUND_REQUEST	\N	u3GkUyr5uk10JGlNPsIybLByKGTfwB0U	2026-02-26 23:28:16.083	2026-05-14 00:44:43.422	\N
cmp4mnbvz0016tcqleuieri0c	ben43@gmail.com	support@helpdesk.example.com	File attachment limit too low	Hi, I'm writing in about: File attachment limit too low. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	bHk1xGoFw6p0dJaOipzjNuIZEvkZQaRi	2026-05-06 14:01:20.922	2026-05-14 00:44:43.423	\N
cmp4mnbvz0017tcqliuz45mq8	rachel44@acme.io	support@helpdesk.example.com	Ticket priority not saving	Hi, I'm writing in about: Ticket priority not saving. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	awucGF6KKHyF9kQgZIozR8z1G6gXzKmo	2026-03-13 02:47:24.929	2026-05-14 00:44:43.424	\N
cmp4mnbvz0019tcqlitvzib5c	hank46@proton.me	support@helpdesk.example.com	Keyboard shortcuts not working	Hi, I'm writing in about: Keyboard shortcuts not working. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	YBI8TTcDMp24YUMoM1HOJy7RQlG51PJK	2026-02-18 05:13:33.467	2026-05-14 00:44:43.424	\N
cmp4mnbvz001btcqlc19oa0os	carol48@gmail.com	support@helpdesk.example.com	How do I reassign a ticket?	Hi, I'm writing in about: How do I reassign a ticket?. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	5lQQFlgT46Z6CR6vJh6X7lrQRrygGxOe	2026-02-18 11:21:02.122	2026-05-14 00:44:43.425	\N
cmp4mnbvz001dtcqlokh00gyl	victor50@proton.me	support@helpdesk.example.com	Dashboard widgets missing after update	Hi, I'm writing in about: Dashboard widgets missing after update. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	ykMq8JQMSYBFCo7sNzpJqfPnivFko18T	2026-04-07 08:30:14.792	2026-05-14 00:44:43.426	\N
cmp4mnbvz001ftcqlywjh17n2	olivia52@acme.io	support@helpdesk.example.com	Billing charge I don't recognise (#2)	Hi, I'm writing in about: Billing charge I don't recognise. Please help me resolve this as soon as possible. Thanks!	CLOSED	\N	\N	PYHZiclmO8SqAeetjuhhL28QROnkIrcM	2026-04-09 22:57:12.947	2026-05-14 00:44:43.427	\N
cmp4mnbvz001gtcql6hi6f81v	bob53@outlook.com	support@helpdesk.example.com	How do I export my data? (#2)	Hi, I'm writing in about: How do I export my data?. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	7a9Wu1zSuKs12ShQnphyq0tdbjdtMXAu	2026-05-09 12:15:31.599	2026-05-14 00:44:43.428	\N
cmp4mnbw0001ltcqli042pba6	mia58@bigenterprise.org	support@helpdesk.example.com	Integration with Slack not working (#2)	Hi, I'm writing in about: Integration with Slack not working. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-05-02 07:46:03.467	2026-05-13 22:24:33.263	\N
cmp4mnbw0001mtcqlen3917qv	clara59@proton.me	support@helpdesk.example.com	How do I add a team member? (#2)	Hi, I'm writing in about: How do I add a team member?. Please help me resolve this as soon as possible. Thanks!	OPEN	\N	\N	\N	2026-04-28 15:13:09.504	2026-05-13 22:24:33.263	\N
cmp4mnbw0001ptcqlmwgrln5n	mia62@outlook.com	support@helpdesk.example.com	API rate limit hit unexpectedly (#2)	Hi, I'm writing in about: API rate limit hit unexpectedly. Please help me resolve this as soon as possible. Thanks!	OPEN	\N	\N	\N	2026-03-14 16:11:47.281	2026-05-13 22:24:33.263	\N
cmp4mnbw0001qtcqlnfyvqb4l	noah63@acme.io	support@helpdesk.example.com	Wrong currency shown on checkout (#2)	Hi, I'm writing in about: Wrong currency shown on checkout. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-03-28 08:42:33.518	2026-05-13 22:24:33.263	\N
cmp4mnbw0001vtcqlrdwaaz7l	pete68@startupco.com	support@helpdesk.example.com	Subscription cancelled but still charged (#2)	Hi, I'm writing in about: Subscription cancelled but still charged. Please help me resolve this as soon as possible. Thanks!	OPEN	TECHNICAL_QUESTION	\N	\N	2026-05-09 02:51:30.64	2026-05-13 22:24:33.263	\N
cmp4mnbw00020tcqlv0umln4z	zane73@startupco.com	support@helpdesk.example.com	Notification emails going to spam (#2)	Hi, I'm writing in about: Notification emails going to spam. Please help me resolve this as soon as possible. Thanks!	OPEN	REFUND_REQUEST	\N	\N	2026-02-16 22:52:19.362	2026-05-13 22:24:33.263	\N
cmp4mnbw00022tcqlhosca0sl	frank75@proton.me	support@helpdesk.example.com	Report shows wrong date range (#2)	Hi, I'm writing in about: Report shows wrong date range. Please help me resolve this as soon as possible. Thanks!	OPEN	TECHNICAL_QUESTION	\N	\N	2026-03-07 12:29:15.583	2026-05-13 22:24:33.263	\N
cmp4mnbw00027tcqlhoy5efh3	anna80@acme.io	support@helpdesk.example.com	Agent stats missing from dashboard (#2)	Hi, I'm writing in about: Agent stats missing from dashboard. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-02-23 18:00:46.363	2026-05-13 22:24:33.263	\N
cmp4mnbw0001itcqlcxkta4nb	rachel55@gmail.com	support@helpdesk.example.com	App crashes on startup (#2)	Hi, I'm writing in about: App crashes on startup. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	MP62ksiqVECdhZY8tPlnEq0wFxqCZ9IS	2026-04-01 00:39:02.965	2026-05-14 00:44:43.429	\N
cmp4mnbw0001ktcqlfnocnd85	uma57@bigenterprise.org	support@helpdesk.example.com	Refund request for duplicate order (#2)	Hi, I'm writing in about: Refund request for duplicate order. Please help me resolve this as soon as possible. Thanks!	RESOLVED	GENERAL_QUESTION	\N	YBI8TTcDMp24YUMoM1HOJy7RQlG51PJK	2026-04-08 04:55:36.719	2026-05-14 00:44:43.432	\N
cmp4mnbw0001ntcql2zh5g455	uma60@acme.io	support@helpdesk.example.com	Invoice missing company name (#2)	Hi, I'm writing in about: Invoice missing company name. Please help me resolve this as soon as possible. Thanks!	RESOLVED	GENERAL_QUESTION	\N	uBY4YyxxxQL53ktyxVs1c16vmbejzUCb	2026-02-28 16:44:23.415	2026-05-14 00:44:43.433	\N
cmp4mnbw0001otcql8hy2dbhy	eve61@techcorp.dev	support@helpdesk.example.com	Two-factor authentication not working (#2)	Hi, I'm writing in about: Two-factor authentication not working. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	awucGF6KKHyF9kQgZIozR8z1G6gXzKmo	2026-03-20 01:31:26.71	2026-05-14 00:44:43.433	\N
cmp4mnbw0001rtcqljgogfsbc	liam64@techcorp.dev	support@helpdesk.example.com	Can I upgrade mid-cycle? (#2)	Hi, I'm writing in about: Can I upgrade mid-cycle?. Please help me resolve this as soon as possible. Thanks!	RESOLVED	REFUND_REQUEST	\N	uBY4YyxxxQL53ktyxVs1c16vmbejzUCb	2026-02-28 04:32:41.51	2026-05-14 00:44:43.434	\N
cmp4mnbw0001stcqlach84ku5	quinn65@bigenterprise.org	support@helpdesk.example.com	Webhook not firing on ticket close (#2)	Hi, I'm writing in about: Webhook not firing on ticket close. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	vQJEI7cUHBs60fuKHWTwwLoOAAIK7aG2	2026-05-01 19:39:20.654	2026-05-14 00:44:43.434	\N
cmp4mnbw0001ttcql67gw2vfy	liam66@techcorp.dev	support@helpdesk.example.com	Mobile app freezes on iOS 17 (#2)	Hi, I'm writing in about: Mobile app freezes on iOS 17. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	NLCdvZfAi8UNy8P9D2ViayDz7GJDtB2P	2026-02-14 16:32:36.971	2026-05-14 00:44:43.435	\N
cmp4mnbw0001utcqlifbmy578	liam67@acme.io	support@helpdesk.example.com	How do I change my email address? (#2)	Hi, I'm writing in about: How do I change my email address?. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	DBDC0RVfSOrgv8D8dueTeKDosMVnGZhs	2026-02-13 02:11:39.946	2026-05-14 00:44:43.435	\N
cmp4mnbw0001xtcqliopb1t9b	ben70@acme.io	support@helpdesk.example.com	SSO setup assistance needed (#2)	Hi, I'm writing in about: SSO setup assistance needed. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	ykMq8JQMSYBFCo7sNzpJqfPnivFko18T	2026-05-11 13:18:29.363	2026-05-14 00:44:43.436	\N
cmp4mnbw0001ytcqljfucv5ic	clara71@proton.me	support@helpdesk.example.com	Data import failed with CSV error (#2)	Hi, I'm writing in about: Data import failed with CSV error. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	iLkZ2GfuFbbCIwDeeW8dts953ksW13kn	2026-05-04 12:56:51.418	2026-05-14 00:44:43.437	\N
cmp4mnbw0001ztcqlhx04wf3m	alice72@freelancer.net	support@helpdesk.example.com	How do I delete my account? (#2)	Hi, I'm writing in about: How do I delete my account?. Please help me resolve this as soon as possible. Thanks!	RESOLVED	REFUND_REQUEST	\N	iLkZ2GfuFbbCIwDeeW8dts953ksW13kn	2026-02-15 10:34:40.152	2026-05-14 00:44:43.438	\N
cmp4mnbw00021tcqlcdnbib5z	jack74@bigenterprise.org	support@helpdesk.example.com	Discount code not applying (#2)	Hi, I'm writing in about: Discount code not applying. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	NLCdvZfAi8UNy8P9D2ViayDz7GJDtB2P	2026-03-03 05:21:54.921	2026-05-14 00:44:43.438	\N
cmp4mnbw00023tcqlejlwzkcg	clara76@proton.me	support@helpdesk.example.com	Can I have a custom domain? (#2)	Hi, I'm writing in about: Can I have a custom domain?. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi	2026-04-11 10:47:13.857	2026-05-14 00:44:43.439	\N
cmp4mnbw00024tcqlp7ep9e6j	karen77@gmail.com	support@helpdesk.example.com	Audit log not showing recent changes (#2)	Hi, I'm writing in about: Audit log not showing recent changes. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	PYHZiclmO8SqAeetjuhhL28QROnkIrcM	2026-04-14 21:35:05.045	2026-05-14 00:44:43.439	\N
cmp4mnbw00025tcqlmalwkiol	ben78@gmail.com	support@helpdesk.example.com	Bulk ticket assignment not working (#2)	Hi, I'm writing in about: Bulk ticket assignment not working. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	MP62ksiqVECdhZY8tPlnEq0wFxqCZ9IS	2026-02-18 07:08:03.404	2026-05-14 00:44:43.44	\N
cmp4mnbw00028tcqlysc8kocd	pete81@yahoo.com	support@helpdesk.example.com	Auto-reply not sending (#2)	Hi, I'm writing in about: Auto-reply not sending. Please help me resolve this as soon as possible. Thanks!	RESOLVED	GENERAL_QUESTION	\N	NSp1uEHUQTgSoNURF4MGwuMJqTG44IpO	2026-04-04 10:02:01.257	2026-05-14 00:44:43.441	\N
cmp4mnbw0002atcql2otewjg1	frank83@freelancer.net	support@helpdesk.example.com	Payment method update failed (#2)	Hi, I'm writing in about: Payment method update failed. Please help me resolve this as soon as possible. Thanks!	OPEN	\N	\N	\N	2026-04-14 11:04:06.409	2026-05-13 22:24:33.263	\N
cmp4mnbw0002btcqlvq5yxco4	noah84@outlook.com	support@helpdesk.example.com	How do I archive old tickets? (#2)	Hi, I'm writing in about: How do I archive old tickets?. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-03-16 16:22:09.759	2026-05-13 22:24:33.263	\N
cmp4mnbw0002ltcql4wuuju0z	david94@bigenterprise.org	support@helpdesk.example.com	Ticket priority not saving (#2)	Hi, I'm writing in about: Ticket priority not saving. Please help me resolve this as soon as possible. Thanks!	OPEN	GENERAL_QUESTION	\N	\N	2026-03-01 10:34:35.147	2026-05-13 22:24:33.263	\N
cmp4mnbw0002mtcqliwzdhji3	mia95@bigenterprise.org	support@helpdesk.example.com	How do I set up auto-close? (#2)	Hi, I'm writing in about: How do I set up auto-close?. Please help me resolve this as soon as possible. Thanks!	OPEN	TECHNICAL_QUESTION	\N	\N	2026-02-23 08:28:30.752	2026-05-13 22:24:33.263	\N
cmp4mnbw0002rtcqlhq40uy29	hank100@proton.me	support@helpdesk.example.com	Dashboard widgets missing after update (#2)	Hi, I'm writing in about: Dashboard widgets missing after update. Please help me resolve this as soon as possible. Thanks!	OPEN	\N	\N	\N	2026-04-10 02:42:25.099	2026-05-13 22:24:33.263	\N
cmp4mnbvz0007tcqly63yyxfm	clara8@gmail.com	support@helpdesk.example.com	Integration with Slack not working	Hi, I'm writing in about: Integration with Slack not working. Please help me resolve this as soon as possible. Thanks!	CLOSED	\N	\N	vQJEI7cUHBs60fuKHWTwwLoOAAIK7aG2	2026-03-16 14:01:30.234	2026-05-14 00:44:43.4	\N
cmp4mnbvz000mtcqlqatsgkf1	rachel23@yahoo.com	support@helpdesk.example.com	Notification emails going to spam	Hi, I'm writing in about: Notification emails going to spam. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi	2026-05-05 23:03:44.301	2026-05-14 00:44:43.415	\N
cmp4mnbvz000ptcql5rba7hov	wendy26@proton.me	support@helpdesk.example.com	Can I have a custom domain?	Hi, I'm writing in about: Can I have a custom domain?. Please help me resolve this as soon as possible. Thanks!	RESOLVED	GENERAL_QUESTION	\N	uBY4YyxxxQL53ktyxVs1c16vmbejzUCb	2026-04-16 08:58:46.486	2026-05-14 00:44:43.417	\N
cmp4mnbvz0013tcqljqji6g4b	hank40@gmail.com	support@helpdesk.example.com	Email threading broken after migration	Hi, I'm writing in about: Email threading broken after migration. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi	2026-03-23 04:46:09.396	2026-05-14 00:44:43.422	\N
cmp4mnbw0001htcqlyvht8ah6	uma54@gmail.com	support@helpdesk.example.com	Feature request: dark mode (#2)	Hi, I'm writing in about: Feature request: dark mode. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	gMYeiKQgBiEa5HYotOr68iXmnESzfVLG	2026-03-12 01:15:31.809	2026-05-14 00:44:43.428	\N
cmp4mnbw0001jtcql8ju0hbix	jack56@acme.io	support@helpdesk.example.com	Password reset email not arriving (#2)	Hi, I'm writing in about: Password reset email not arriving. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	iLkZ2GfuFbbCIwDeeW8dts953ksW13kn	2026-04-26 01:06:24.108	2026-05-14 00:44:43.43	\N
cmp4mnbw0001wtcql32nl7gm7	victor69@startupco.com	support@helpdesk.example.com	Search results returning incorrect data (#2)	Hi, I'm writing in about: Search results returning incorrect data. Please help me resolve this as soon as possible. Thanks!	RESOLVED	\N	\N	bHk1xGoFw6p0dJaOipzjNuIZEvkZQaRi	2026-02-22 13:12:38.923	2026-05-14 00:44:43.436	\N
cmp4mnbw0002ctcqlhbow6gh8	tina85@yahoo.com	support@helpdesk.example.com	SLA timer not pausing on hold (#2)	Hi, I'm writing in about: SLA timer not pausing on hold. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	u3GkUyr5uk10JGlNPsIybLByKGTfwB0U	2026-03-27 06:36:05.851	2026-05-14 00:44:43.443	\N
cmp4mnbw0002dtcqlkg5twm4k	eve86@yahoo.com	support@helpdesk.example.com	Widget not loading on Safari (#2)	Hi, I'm writing in about: Widget not loading on Safari. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	iLkZ2GfuFbbCIwDeeW8dts953ksW13kn	2026-03-16 04:55:12.595	2026-05-14 00:44:43.447	\N
cmp4mnbw0002etcqlz5jxkyfh	grace87@outlook.com	support@helpdesk.example.com	How do I CC a customer on a reply? (#2)	Hi, I'm writing in about: How do I CC a customer on a reply?. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi	2026-03-19 08:00:37.039	2026-05-14 00:44:43.449	\N
cmp4mnbw0002gtcql7brzlhf5	alice89@outlook.com	support@helpdesk.example.com	Custom field values not saving (#2)	Hi, I'm writing in about: Custom field values not saving. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	uFaE10wzEWnLxvkgwYrVPjqkL2KXoK19	2026-04-19 18:00:03.35	2026-05-14 00:44:43.45	\N
cmp4mnbw0002htcqlg1mw2wpa	mia90@freelancer.net	support@helpdesk.example.com	Email threading broken after migration (#2)	Hi, I'm writing in about: Email threading broken after migration. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	iLkZ2GfuFbbCIwDeeW8dts953ksW13kn	2026-04-17 22:21:06.331	2026-05-14 00:44:43.451	\N
cmp4mnbw0002itcqlmup74vjk	noah91@icloud.com	support@helpdesk.example.com	How do I merge tickets? (#2)	Hi, I'm writing in about: How do I merge tickets?. Please help me resolve this as soon as possible. Thanks!	RESOLVED	TECHNICAL_QUESTION	\N	awucGF6KKHyF9kQgZIozR8z1G6gXzKmo	2026-05-05 13:48:21.592	2026-05-14 00:44:43.452	\N
cmp4mnbw0002jtcql90j49zc1	victor92@proton.me	support@helpdesk.example.com	Canned responses not appearing (#2)	Hi, I'm writing in about: Canned responses not appearing. Please help me resolve this as soon as possible. Thanks!	RESOLVED	GENERAL_QUESTION	\N	bHk1xGoFw6p0dJaOipzjNuIZEvkZQaRi	2026-04-14 00:35:29.71	2026-05-14 00:44:43.452	\N
cmp4mnbw0002ktcqle2bv820a	quinn93@proton.me	support@helpdesk.example.com	File attachment limit too low (#2)	Hi, I'm writing in about: File attachment limit too low. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	PYHZiclmO8SqAeetjuhhL28QROnkIrcM	2026-04-25 15:50:05.28	2026-05-14 00:44:43.453	\N
cmp4mnbw0002ntcqlpihue1xh	mia96@acme.io	support@helpdesk.example.com	Keyboard shortcuts not working (#2)	Hi, I'm writing in about: Keyboard shortcuts not working. Please help me resolve this as soon as possible. Thanks!	CLOSED	TECHNICAL_QUESTION	\N	awucGF6KKHyF9kQgZIozR8z1G6gXzKmo	2026-03-23 14:14:54.589	2026-05-14 00:44:43.454	\N
cmp4mnbw0002otcql62jusxpg	frank97@freelancer.net	support@helpdesk.example.com	Report export takes too long (#2)	Hi, I'm writing in about: Report export takes too long. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	PYHZiclmO8SqAeetjuhhL28QROnkIrcM	2026-04-29 11:01:09.96	2026-05-14 00:44:43.454	\N
cmp4mnbw0002ptcqltn6t2vy6	olivia98@yahoo.com	support@helpdesk.example.com	How do I reassign a ticket? (#2)	Hi, I'm writing in about: How do I reassign a ticket?. Please help me resolve this as soon as possible. Thanks!	CLOSED	\N	\N	PYHZiclmO8SqAeetjuhhL28QROnkIrcM	2026-04-17 07:42:53.033	2026-05-14 00:44:43.455	\N
cmp4iyt860000o0qlr8gn1d6z	alice@example.com	support@helpdesk.com	Cannot login to my account	Hi, I have been trying to login for the past hour but keep getting an error. Please help.	OPEN	\N	\N	\N	2026-05-13 20:41:30.486	2026-05-14 00:45:27.658	\N
cmp4mnbw00026tcqloxz31t2n	hank79@bigenterprise.org	support@helpdesk.example.com	How do I set business hours? (#2)	Hi, I'm writing in about: How do I set business hours?. Please help me resolve this as soon as possible. Thanks!	RESOLVED	GENERAL_QUESTION	\N	PYHZiclmO8SqAeetjuhhL28QROnkIrcM	2026-04-29 09:52:01.939	2026-05-14 00:44:43.44	\N
cmp4mnbw00029tcqlmn60swiu	ben82@freelancer.net	support@helpdesk.example.com	GDPR data export request (#2)	Hi, I'm writing in about: GDPR data export request. Please help me resolve this as soon as possible. Thanks!	CLOSED	REFUND_REQUEST	\N	awucGF6KKHyF9kQgZIozR8z1G6gXzKmo	2026-04-11 04:14:55.063	2026-05-14 00:44:43.442	\N
cmp4mnbw0002ftcqlwf32et8e	david88@gmail.com	support@helpdesk.example.com	Duplicate tickets being created (#2)	Hi, I'm writing in about: Duplicate tickets being created. Please help me resolve this as soon as possible. Thanks!	CLOSED	GENERAL_QUESTION	\N	NtDkCPTPED7XRdnuiBqwaHRRBZdi2d4C	2026-02-22 19:47:54.123	2026-05-14 00:44:43.45	\N
cmp4mnbw0002qtcqlkfcjq8vm	grace99@acme.io	support@helpdesk.example.com	Tags not syncing across agents (#2)	Hi, I'm writing in about: Tags not syncing across agents. Please help me resolve this as soon as possible. Thanks!	RESOLVED	REFUND_REQUEST	\N	ykMq8JQMSYBFCo7sNzpJqfPnivFko18T	2026-03-10 01:21:05.246	2026-05-14 00:44:43.456	\N
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, "deletedAt") FROM stdin;
YBI8TTcDMp24YUMoM1HOJy7RQlG51PJK	Karen Lee	karen.lee@gmail.com	f	\N	2023-11-05 00:00:00	2023-11-05 00:00:00	AGENT	\N
uFaE10wzEWnLxvkgwYrVPjqkL2KXoK19	Liam Brown	liam.brown@gmail.com	f	\N	2023-12-19 00:00:00	2023-12-19 00:00:00	AGENT	\N
7Dp2gcbChbjzXgD3RT7xtBZGQlxdLlTT	Abhisek Dutta	abhisek.dutta.507@gmail.com	f	\N	2026-05-12 14:04:22.523	2026-05-12 21:35:57.526	ADMIN	\N
ykMq8JQMSYBFCo7sNzpJqfPnivFko18T	Mia Gonzalez	mia.gonzalez@gmail.com	f	\N	2024-01-08 00:00:00	2024-01-08 00:00:00	AGENT	\N
NSp1uEHUQTgSoNURF4MGwuMJqTG44IpO	Arindam Dutta	darindam507@gmail.com	f	\N	2026-05-12 22:13:58.674	2026-05-12 22:13:58.674	AGENT	\N
u3GkUyr5uk10JGlNPsIybLByKGTfwB0U	Jane Smith	jane@google.com	f	\N	2026-05-12 22:56:43.706	2026-05-12 22:56:43.706	AGENT	2026-05-12 22:57:37.46
iLkZ2GfuFbbCIwDeeW8dts953ksW13kn	John Smith	john@google.com	f	\N	2026-05-12 23:55:47.576	2026-05-12 23:55:47.576	AGENT	\N
bHk1xGoFw6p0dJaOipzjNuIZEvkZQaRi	Noah Davis	noah.davis@gmail.com	f	\N	2024-02-14 00:00:00	2024-02-14 00:00:00	AGENT	\N
KneMcyf79jg1lvkX4RsWNGqwFNHoJc6P	Olivia White	olivia.white@gmail.com	f	\N	2024-03-21 00:00:00	2024-03-21 00:00:00	AGENT	\N
DBDC0RVfSOrgv8D8dueTeKDosMVnGZhs	Paul Harris	paul.harris@gmail.com	f	\N	2024-04-07 00:00:00	2024-04-07 00:00:00	AGENT	2026-05-15 09:25:48.163
8umVCkgLpRvAS39MCgTNNeORDUngfKQw	Quinn Adams	quinn.adams@gmail.com	f	\N	2024-05-16 00:00:00	2024-05-16 00:00:00	AGENT	\N
JEW2aSWbeEdIDppQjJuH2Ye7DbaKtsEi	Rachel Scott	rachel.scott@gmail.com	f	\N	2024-06-25 00:00:00	2024-06-25 00:00:00	AGENT	\N
IDkE5Q6AVNe1sjpEfqnbf3o3rPmrbjQl	Samuel Turner	samuel.turner@gmail.com	f	\N	2024-07-11 00:00:00	2024-07-11 00:00:00	AGENT	\N
NtDkCPTPED7XRdnuiBqwaHRRBZdi2d4C	Tina Walker	tina.walker@gmail.com	f	\N	2024-08-30 00:00:00	2024-08-30 00:00:00	AGENT	\N
5lQQFlgT46Z6CR6vJh6X7lrQRrygGxOe	Bruce Lee	agent1@example.com	f	\N	2026-05-14 00:38:10.635	2026-05-15 07:23:27.212	AGENT	2026-05-15 07:23:38.383
1kTeZJlEdgi2lWEg8VKmaIfOHA6m6VkW	Bruce Lee	brucelee@gmail.com	f	\N	2026-05-15 07:24:16.308	2026-05-15 07:24:16.308	AGENT	\N
NLCdvZfAi8UNy8P9D2ViayDz7GJDtB2P	Alice Johnson	alice.johnson@gmail.com	f	\N	2023-01-15 00:00:00	2023-01-15 00:00:00	AGENT	\N
vQJEI7cUHBs60fuKHWTwwLoOAAIK7aG2	Bob Martinez	bob.martinez@gmail.com	f	\N	2023-02-20 00:00:00	2023-02-20 00:00:00	AGENT	\N
uBY4YyxxxQL53ktyxVs1c16vmbejzUCb	Carol Williams	carol.williams@gmail.com	f	\N	2023-03-08 00:00:00	2023-03-08 00:00:00	AGENT	\N
MP62ksiqVECdhZY8tPlnEq0wFxqCZ9IS	David Chen	david.chen@gmail.com	f	\N	2023-04-12 00:00:00	2023-04-12 00:00:00	AGENT	\N
XItPDS0D2lH00m7U8i6cc8jZjgK1hNpM	Eva Nguyen	eva.nguyen@gmail.com	f	\N	2023-05-03 00:00:00	2023-05-03 00:00:00	AGENT	\N
gMYeiKQgBiEa5HYotOr68iXmnESzfVLG	Frank Patel	frank.patel@gmail.com	f	\N	2023-06-17 00:00:00	2023-06-17 00:00:00	AGENT	\N
PYHZiclmO8SqAeetjuhhL28QROnkIrcM	Grace Kim	grace.kim@gmail.com	f	\N	2023-07-22 00:00:00	2023-07-22 00:00:00	AGENT	\N
7a9Wu1zSuKs12ShQnphyq0tdbjdtMXAu	Henry Okafor	henry.okafor@gmail.com	f	\N	2023-08-09 00:00:00	2023-08-09 00:00:00	AGENT	\N
Kfqz844hruFF6DZccoPqmNDahWPtJDoc	Isla Thompson	isla.thompson@gmail.com	f	\N	2023-09-14 00:00:00	2023-09-14 00:00:00	AGENT	\N
awucGF6KKHyF9kQgZIozR8z1G6gXzKmo	James Rivera	james.rivera@gmail.com	f	\N	2023-10-30 00:00:00	2023-10-30 00:00:00	AGENT	\N
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: reply reply_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reply
    ADD CONSTRAINT reply_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: ticket ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "account_userId_idx" ON public.account USING btree ("userId");


--
-- Name: reply_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reply_ticketId_idx" ON public.reply USING btree ("ticketId");


--
-- Name: session_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX session_token_key ON public.session USING btree (token);


--
-- Name: session_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "session_userId_idx" ON public.session USING btree ("userId");


--
-- Name: ticket_agentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ticket_agentId_idx" ON public.ticket USING btree ("agentId");


--
-- Name: ticket_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_status_idx ON public.ticket USING btree (status);


--
-- Name: user_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reply reply_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reply
    ADD CONSTRAINT "reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reply reply_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reply
    ADD CONSTRAINT "reply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public.ticket(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket ticket_agentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT "ticket_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict JuKy4iW0aejfNF8V9dAtMtl9GlVpecIlMAqLfgWsRkncO0st3Lx3AjHDyx1EEaR

