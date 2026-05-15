--
-- PostgreSQL database dump
--

\restrict 95uBObat3xFcLyG6WBmCvM34ncUCJHVpqtm9hS0dNQoDedDNqX8qmDZthAYNk0l

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
cd0148c0-4b47-48ba-a528-d02d9fa2f6ab	173cd376e83bfee4398a609edfc093f250d8f83b5a91ed6e789d5be09e77b9f0	2026-05-12 20:03:19.88728+05:30	20260426100211_init	\N	\N	2026-05-12 20:03:19.850053+05:30	1
5ae6293e-80b2-45ef-b400-f8a3a4242fcb	4597fde3d9ffdee13607ce5ee7126ac10be663c5b36212914547396cd80782ae	2026-05-12 20:03:19.912819+05:30	20260427043939_add_better_auth_schema	\N	\N	2026-05-12 20:03:19.887812+05:30	1
37b3e044-8944-4b1e-acd1-ebddfe76bfab	577bd40d4f6ebfd110fb7d760002e480ae88bf9e8e929f51c045676eaf8cb707	2026-05-12 20:03:19.91787+05:30	20260428024814_drop_ticket_reply	\N	\N	2026-05-12 20:03:19.913185+05:30	1
7ea00b2a-8d5d-4de8-a337-f1f0eff117a6	7896918b4e275e8eac3a44ada4ecc95569d333f5d0b01ba1968d14b2eb0b808b	2026-05-13 04:40:51.609521+05:30	20260512223603_add_deleted_at_to_user	\N	\N	2026-05-13 04:40:51.591052+05:30	1
faecbcef-a0d5-4336-bdb7-fac40b79b868	76b028318a16020a6f0531a1817688d69227ccb4e6d0f720f8f4643e9199bd67	2026-05-14 02:22:22.969069+05:30	20260513201336_add_ticket_model	\N	\N	2026-05-14 02:22:22.716984+05:30	1
293c0491-e97c-452d-83cc-d67489a0d03e	80d24c980a4561c5568c9e792a5d386ae4b590fc5e1e4a75ba706ddf0e0c3735	2026-05-14 02:22:22.976672+05:30	20260513203757_add_ticket_body_html	\N	\N	2026-05-14 02:22:22.971908+05:30	1
72a8f863-f630-43f7-88cf-05ae000742ea	4f532d5ad9947c6ca00ab9bd212aeb9db606a3631d3fc3b80e45bc7ed1aa43fd	2026-05-15 13:42:50.003419+05:30	20260514205359_add_reply_model	\N	\N	2026-05-15 13:42:49.86811+05:30	1
cceabb60-c85c-489a-a61f-f85d64122b4e	33cda6611e6b4459d462683a2f7e64df0aae2fb254b1fc98f1a0399fe6dac327	2026-05-15 13:42:50.02033+05:30	20260514210403_make_reply_author_nullable	\N	\N	2026-05-15 13:42:50.004461+05:30	1
e7db537c-ae58-446f-b3e7-e9aaef789c3e	4638b25382112019f9d9a5b58ec9e6913d73a7f189b0f6568327ddea4e89dfaf	2026-05-15 14:49:08.493086+05:30	20260515091214_add_reply_body_html	\N	\N	2026-05-15 14:49:08.483233+05:30	1
\.


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
gREgTL2RZDytG56EIVLujdUhSmFg4gOw	7x6pcwqX8tYlQqAnMWwbgic9E9S2Mizc	credential	7x6pcwqX8tYlQqAnMWwbgic9E9S2Mizc	\N	\N	\N	\N	\N	\N	991d74ea9170c2b291185471a330bc06:c2083c5f3abb9a2f6bda9d7ca66b5028e16289026cde96676137cacda583725c91d4d1fdb77b4c7c8954ad242c6623aa2828d8e1baf32b0447850e24bd0f108e	2026-05-15 09:20:50.514	2026-05-15 09:20:50.514
yLtCVKAkrgDO1XmQrcmXib5y21gytPuo	IAF4rI5zcClWN5VO1s2nhWefYnoGPRee	credential	IAF4rI5zcClWN5VO1s2nhWefYnoGPRee	\N	\N	\N	\N	\N	\N	8476e64b1f020d7b52b62f100cd8248d:b9dcda9f8f6678cfc7b391f8c9b11a294c29fae2f498791d420785824c569702dbdd53015f52fb7a000c741c62517c89cc8846690ccebf1cd5f44a5ee655a82a	2026-05-15 09:20:50.583	2026-05-15 09:20:50.583
BfF9Hf40lWuibafG32HeHaugXQBWusmY	ZU0UThqA22feA9Yxa7SH8cDzaG6Qpt8p	credential	ZU0UThqA22feA9Yxa7SH8cDzaG6Qpt8p	\N	\N	\N	\N	\N	\N	2eea8f2ac52404eba9871732f4635304:ca3a6d546840d4147f1b674b80ca0418bffa462bd634d116edc1ae4cc725447b57fc192c4275411cc138b53489fb3f8503b836cb1598035cfb478ce30b6e35a5	2026-05-15 09:20:50.64	2026-05-15 09:20:50.64
bZnu6t8uNUyAJOAAZIAzRWkpLYylIjN3	W0W9bQeiImNVWGFqgOpvd5S142RIgOrH	credential	W0W9bQeiImNVWGFqgOpvd5S142RIgOrH	\N	\N	\N	\N	\N	\N	0d6d1776eda66ee7dd815f272ac99958:af066ee4715232f554798e880294a3f6e22ef595efbea34c5b02d862d633a6b0c82bf4430876f49a4ce57045c8b3b4f6653d4881b057397d2adc230d284ac4b8	2026-05-15 09:20:50.697	2026-05-15 09:20:50.697
cIzmXj9iYqoMNu9nLFGhxo0voLjEQqIM	FiqA0a21Lovt2KqpPrTGkh1tfN6iv9dj	credential	FiqA0a21Lovt2KqpPrTGkh1tfN6iv9dj	\N	\N	\N	\N	\N	\N	423b7fc306d6013ef7b5635eb34319dc:ce87a921361da635f67b7d0eaf98da7091f31edc27a0a2dbaae2567b10f4d8c1e8b4935549c6d488978cf2f304c3eceb4ccfcc7ab734cacc91e7e6bb76ca159f	2026-05-15 09:20:50.754	2026-05-15 09:20:50.754
jqdar9hfIJECxuLYxvjaQEyRpklbNBwk	BNQnmg6AfYIjaZBYk40tyVZmgwJyiVkX	credential	BNQnmg6AfYIjaZBYk40tyVZmgwJyiVkX	\N	\N	\N	\N	\N	\N	33911754db0c63077df7e494df9bedfa:068466423d38af0afe64dec4210f88becdb958824e84345b2198b0e959e054bc524c246b5bcea5f7a4c3a718609993cdbc0b5aa48c3c4a629404a987343a012f	2026-05-15 09:20:50.812	2026-05-15 09:20:50.812
HYbO5ucbUjIKIJLrtHW7DkVHg3geNJmT	L4qXDOaNTCESjaiD96LCqzHT2ntKIwtb	credential	L4qXDOaNTCESjaiD96LCqzHT2ntKIwtb	\N	\N	\N	\N	\N	\N	d21a9ca8d42676fbdcae96c7eabe0252:70f07c19bf5fa51aaf6001345b975204de53cdf6c7c9110f303c01e5fa9468ff654cb78a2f09b6c9878e1cc955a41f507458d4f99725c9f6a65a55d5f6d74a32	2026-05-15 09:20:50.869	2026-05-15 09:20:50.869
sXK0xGxKE6syA9fcJhNRG1r6DFOChXPG	D1u1HwiotwCXIcOsbz1gvjJgEll5Gq0Y	credential	D1u1HwiotwCXIcOsbz1gvjJgEll5Gq0Y	\N	\N	\N	\N	\N	\N	f0d78f7510380172314d32fce7fce72a:5d6b7edb895681a3334a5f0a9b780c9979e4b5215b115674175aa7be57cea7234a9a29a95e7cb12ff547e526dff391e8c7d82692a2a0b98ef1bbf92719071a99	2026-05-15 09:20:50.925	2026-05-15 09:20:50.925
zDISSlG8o2TQdQmgxSO9EV95nOPX99Zz	n5macIDAePN9JrzbFEr0flVmuhoosNWM	credential	n5macIDAePN9JrzbFEr0flVmuhoosNWM	\N	\N	\N	\N	\N	\N	f80d1e070d7678876e65e2d8e4e3bcec:5c2832f807d419e72c167caa5938a817c4712b39537c28f4f67b0c0d1490febde32146a7931f7fa76034e7f13c618939f687a900bb3589ec476a6af8b0d1e310	2026-05-15 09:20:50.981	2026-05-15 09:20:50.981
JSsOCcbzSCgkkXN8c9nR5Df7narXhoet	cQZGMfEhPuH8IfrNjFWOH1EDsFhAEGjv	credential	cQZGMfEhPuH8IfrNjFWOH1EDsFhAEGjv	\N	\N	\N	\N	\N	\N	85bb8c191bdd4d8a9601c53fbb5b21ec:2e9596f3c3469971206e5fdbc34c6f1967f3b352266375285d7e3e164d7256e0593e1d09510b5565c6e317b3b56da0fd1caffb2b0387eea5490a4e92db3a6c2d	2026-05-15 09:20:51.035	2026-05-15 09:20:51.035
jqYrufp9xpRp4xm0huqwEUWa2hezdqHk	idUO4ZClCwD2xx3qD8Z4xBh7lE9x3YiY	credential	idUO4ZClCwD2xx3qD8Z4xBh7lE9x3YiY	\N	\N	\N	\N	\N	\N	b2555f87f73c40d2efbd038ee5d1c3c2:baf2d43b1fa368deb2dae6056194c1202249b434db3407b100325f596d0e356476481b7079b1e052123c07925132d8ccf80c373c76a427868ec3aa1aac4e2d94	2026-05-15 09:20:51.091	2026-05-15 09:20:51.091
aHIiDtWR2osn7yiDveKyBhY0YWSDtXEx	1M1uLUHLIocvaWFxw7BRXn1HMJYKzbru	credential	1M1uLUHLIocvaWFxw7BRXn1HMJYKzbru	\N	\N	\N	\N	\N	\N	3af70b9d1b8ac0ad24992a8989b2680f:b029c1f74336875132cf7532a7518316413d626b8acba4c74e1407dc5c063b3e1cb3a91c51713ff005546959a9c8dee616bc7f3290df0f5474563d0b6740c779	2026-05-15 09:20:51.155	2026-05-15 09:20:51.155
X6nKkd1CD5UhQU7GXOkBabUBkcD0Ghsb	G1s90wFQWEfbOmYY0zOWk4oc5YWMgWSv	credential	G1s90wFQWEfbOmYY0zOWk4oc5YWMgWSv	\N	\N	\N	\N	\N	\N	f9f2ef8afdd1711a76377adc7880ca0c:f638d0cffdd7d71e8e414a66aaaf40bfc8851bb13b68388ef249d26e7d6eaccb39fcb92417f59c0538aafb1c6672114db665e160ee6cbd2a84f7cb57750a82dc	2026-05-15 09:20:51.21	2026-05-15 09:20:51.21
9BBscIspkn755Bc5dgrzPD1TEfuVkoX4	lhmEKmaoipvtd7dlbfIetIsatCPTV20L	credential	lhmEKmaoipvtd7dlbfIetIsatCPTV20L	\N	\N	\N	\N	\N	\N	c7e38df1f52d880161643bf0588e15bd:16cdbe1e62f4b79442831801dc8f7ff6c9ee57994acd600161f602920e1ffc01fa5e01ed49c1d387fce4fb780f4e0d343c2bf869efc13527e133a8337da0603a	2026-05-15 09:20:51.267	2026-05-15 09:20:51.267
B8SDOhlrYsAYiBYazDcpqzVolhUpojAI	nmt0Qh1HtfmpWnnpcpiEDSlrPk8n7nQX	credential	nmt0Qh1HtfmpWnnpcpiEDSlrPk8n7nQX	\N	\N	\N	\N	\N	\N	7224dfe83e19ce0c0c7dac09e1cf8e0c:7fc222124e9d155a1b35731a1ded0a8dd1734bfecd6f0bb8a508610a7a128fc2a5c72f074e743016f351a3e9e1fe607967e8f8d29fc141bc0ee29063a0d1ff2d	2026-05-15 09:20:51.323	2026-05-15 09:20:51.323
1neBfOCYeBOY9lo40oTtgumS3n6iKSF7	axJqnOE1THccLyJyd4pfr0pwMJnmZmG4	credential	axJqnOE1THccLyJyd4pfr0pwMJnmZmG4	\N	\N	\N	\N	\N	\N	d4da2a1b3ac92df740b96612393e6f42:80cd2926dcad0ca8f5014cb02aec7e6b6a10291065f739f1b5816a9cfe6f96ea38795f4404a553c97d9a78c2b01ad2b7fd0bb3c74ee678178f5fd536d6da159c	2026-05-15 09:20:51.379	2026-05-15 09:20:51.379
uA0LZ8lFOhztams5voJ5u2E4U38JzQMe	LUYcVpz2EGKf6MkNkaYu3F540M6qZvBm	credential	LUYcVpz2EGKf6MkNkaYu3F540M6qZvBm	\N	\N	\N	\N	\N	\N	073584a0614a2f296a3255ecd7b4cc5f:60822ad98c881b04a1217ded79c6cd63a8060e33e7997a24b6a813cc8af403188e1e2b0784a254b6e85773c53271d3e190ed7f4868763cd35f2412c8b3a1e864	2026-05-15 09:20:51.434	2026-05-15 09:20:51.434
m9i5iR4kSb29V4T7U4D8dBMnh3QXyzdM	XK4M5qFFX4eGP23SoszmScqKqXc4XGW6	credential	XK4M5qFFX4eGP23SoszmScqKqXc4XGW6	\N	\N	\N	\N	\N	\N	ceffc92ce1a5670f738fd2044c8553c7:c9893caa367ece2a05a0d1261ffec328477e7341e00c2a714322fa33b7cdece2e323193cff8a0527b56d73fe74fac601b479cc9981cc0608a8b5948c5366b22b	2026-05-15 09:20:51.49	2026-05-15 09:20:51.49
pvYdfDUmmWT1ajNXn6J31RRTs9zxcT9D	jCpGeGWMVn0qGZlotVF3eYluxo166AnZ	credential	jCpGeGWMVn0qGZlotVF3eYluxo166AnZ	\N	\N	\N	\N	\N	\N	1c83ae3e1d4ea5fc35ac135d64546d1c:a4e1dfe448070c887490812a5388e5523f591970b2fb3c590dafb72a9e062caff77fc4bf51c13a8589abfbf7511bec353e5dc8b6b6ac01143bebced2ecb47677	2026-05-15 09:20:51.546	2026-05-15 09:20:51.546
oLfg8KrcvhfsVwe1MWtEiL2JyORB1i3k	UM6VHn1NvOTKxmqwgDGLiHLXBihfQ0is	credential	UM6VHn1NvOTKxmqwgDGLiHLXBihfQ0is	\N	\N	\N	\N	\N	\N	4a8f03a6548fcf8928828cc50f1931ad:63f16a9726a242270dfff2e511f61f6943696983167688315d2b709a9f48bd905ada0955b5a32451ecedf4de917f9abe1f17031b94b3a1cf517d07e2fb36bef5	2026-05-15 09:20:51.601	2026-05-15 09:20:51.601
giACk8vmFl79cFM4J5EHzglnXQRDhjrL	okRr0bHD224aYuwi8do1WLqOCphrm7qO	credential	okRr0bHD224aYuwi8do1WLqOCphrm7qO	\N	\N	\N	\N	\N	\N	20f9b4a3d15b708adfce9ffb63381c4d:a0eae63dda647fb8266579862b1cce972c4db2049e2ed5f87b34250f33f280588eed384183911771a5375f81d5963116d84450b9d850dc759427fcb4271c0d42	2026-05-15 09:20:51.658	2026-05-15 09:20:51.658
NlcgVERX0zGQXVqqYSScz7gUQKSOeUHf	k1NuZm9owRGOerCWCn8p7LFnJbFlRHx7	credential	k1NuZm9owRGOerCWCn8p7LFnJbFlRHx7	\N	\N	\N	\N	\N	\N	8ffc39ac7adb6b8ba16ba1447444d52c:a108f47243292db6785acfce38c6e800657c8b92c6f510830b1dbe4618ea36c464a4761dea101dfbc6b82c13523c072b5eb9556a142dc371b08fc4c064f00516	2026-05-15 09:20:51.713	2026-05-15 09:20:51.713
\.


--
-- Data for Name: reply; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reply (id, "ticketId", "authorId", body, "createdAt", "fromEmail", "bodyHtml") FROM stdin;
cmp6pj8dy000167qlm2nayzjr	cmp6pj8de000067ql91zx4fht	\N	Forwarded reply body.	2026-05-15 09:20:53.302	reply.fwd.1778836853254@example.com	\N
cmp6pj8eg000467qlylast2zs	cmp6pj8dz000267qlum825jk8	\N	Reply body.	2026-05-15 09:20:53.32	reply.nodedup.1778836853247@example.com	\N
cmp6pj8ej000567ql0704p7eu	cmp6pj8dz000367qlpdc7e0kb	\N	This is a reply body.	2026-05-15 09:20:53.323	reply.re.1778836853248@example.com	\N
cmp6pj8fd000767ql5886clar	cmp6pj8f5000667ql2m4r0vby	\N	Plain text only reply.	2026-05-15 09:20:53.353	reply.nohtml.1778836853337@example.com	\N
cmp6pj8fo000967qliyzlhxx0	cmp6pj8fd000867qlab31lgxt	\N	Plain text reply body.	2026-05-15 09:20:53.364	reply.html.1778836853349@example.com	<p>HTML <strong>reply</strong></p>
cmp6pj8hz000b67qlyiygxv19	cmp6pj8hq000a67ql2bhmf89v	\N	Plain text fallback.	2026-05-15 09:20:53.447	reply.prose.1778836853424@example.com	<p>This has <strong>bold text</strong> in it.</p>
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId") FROM stdin;
2va5GW4ZfCTUC9foiQkJwns7MVxX3pjw	2026-05-22 09:20:50.52	DyDQPSAAmREgkQ329ATyxOkVh6wqlCCB	2026-05-15 09:20:50.52	2026-05-15 09:20:50.52			7x6pcwqX8tYlQqAnMWwbgic9E9S2Mizc
YD7n3gNS4e8AER9OkD0Fnogudr769mK9	2026-05-22 09:20:50.584	feDlEECsfLCDJ0cnm4PGTXhX2DvPm8wt	2026-05-15 09:20:50.584	2026-05-15 09:20:50.584			IAF4rI5zcClWN5VO1s2nhWefYnoGPRee
Hi5FLowxEFueFSoRWkae6GqZNKEGTbTp	2026-05-22 09:20:50.641	b7cqx8dAZhQn0Q7rUW4cxq5tbXkuNWql	2026-05-15 09:20:50.641	2026-05-15 09:20:50.641			ZU0UThqA22feA9Yxa7SH8cDzaG6Qpt8p
m3QGXzR3ydlmaWrKRoQ1Vv5k0L54YEYZ	2026-05-22 09:20:50.699	RzEcTcSMJFL6qh3TwUDZXomPvYEJpbTv	2026-05-15 09:20:50.699	2026-05-15 09:20:50.699			W0W9bQeiImNVWGFqgOpvd5S142RIgOrH
BkAJRMJLvSFDTqYv7DWQ3noCQdd8MSam	2026-05-22 09:20:50.756	joyPeigsCnSLWkDMOl0JxJtj3ZmIR2d4	2026-05-15 09:20:50.756	2026-05-15 09:20:50.756			FiqA0a21Lovt2KqpPrTGkh1tfN6iv9dj
9XWJVzn4rbhcUapqRB9sqQuwpmFcTWqp	2026-05-22 09:20:50.815	y0zrKfsE9kGnBi16PYw85AtCXSZxazfV	2026-05-15 09:20:50.815	2026-05-15 09:20:50.815			BNQnmg6AfYIjaZBYk40tyVZmgwJyiVkX
0oUnktiM2h4hNuUnbtzAmIuCsUV1LTTl	2026-05-22 09:20:50.87	Tc7Ts2rxCkOsZZTdOv9w4tnp6ZHWretN	2026-05-15 09:20:50.87	2026-05-15 09:20:50.87			L4qXDOaNTCESjaiD96LCqzHT2ntKIwtb
QlE2hkUh9YLTSG9m8BeMcRHomeeYjdTG	2026-05-22 09:20:50.927	4rL523vOj1t34yKWE4tDYUIfiHF6WlLt	2026-05-15 09:20:50.927	2026-05-15 09:20:50.927			D1u1HwiotwCXIcOsbz1gvjJgEll5Gq0Y
u2S6QqTg6efOqmlxZZ9PyFDq6PmQpbyD	2026-05-22 09:20:50.982	JkbcDYdEqu4482Rg1BcVgr4s95e6UfVO	2026-05-15 09:20:50.982	2026-05-15 09:20:50.982			n5macIDAePN9JrzbFEr0flVmuhoosNWM
7ASVjS3HHu9uFkK9soysIkQTjatspOKY	2026-05-22 09:20:51.036	pnZKzMK84eBydd0sO3vos8tGkGWqfQeU	2026-05-15 09:20:51.036	2026-05-15 09:20:51.036			cQZGMfEhPuH8IfrNjFWOH1EDsFhAEGjv
yL2rMNLPgs1sTVjdJvUBJpL1IhqwDF9E	2026-05-22 09:20:51.092	796nLyVl3K9nnpFSNPf89XPLrqBZmyMN	2026-05-15 09:20:51.092	2026-05-15 09:20:51.092			idUO4ZClCwD2xx3qD8Z4xBh7lE9x3YiY
EP01P9ELh4SssO8DwWVuiGPcQiEgdRrc	2026-05-22 09:20:51.157	07TuQNXP2lmfZM92bdK4VIkw7uyYSBnT	2026-05-15 09:20:51.157	2026-05-15 09:20:51.157			1M1uLUHLIocvaWFxw7BRXn1HMJYKzbru
TwDEUwAnPqARu9qlYuYRFzGkMKueOzQg	2026-05-22 09:20:51.212	U8RSU1n7V6kHNpqHyPWCIP7oNL2hijyv	2026-05-15 09:20:51.212	2026-05-15 09:20:51.212			G1s90wFQWEfbOmYY0zOWk4oc5YWMgWSv
haAdDMxndq67B34vwcNG1ezgmCZ6TiqF	2026-05-22 09:20:51.268	V5s1UoHh80z8r1dplRt7d7jaDaLFU3X1	2026-05-15 09:20:51.268	2026-05-15 09:20:51.268			lhmEKmaoipvtd7dlbfIetIsatCPTV20L
kR0YaVs8N51h5C6NstgyfoWnuvNCt2s0	2026-05-22 09:20:51.324	mQ8fTNNT9hxn3tixJS0UE4jnyfGGc5wO	2026-05-15 09:20:51.324	2026-05-15 09:20:51.324			nmt0Qh1HtfmpWnnpcpiEDSlrPk8n7nQX
QJJ5EGWJ6UYbJDKLtc10jl4U080eu1oc	2026-05-22 09:20:51.38	km09CZ1FvdqsSkmfpESqI5vnzdYyaMaY	2026-05-15 09:20:51.38	2026-05-15 09:20:51.38			axJqnOE1THccLyJyd4pfr0pwMJnmZmG4
MTNvAkIqcgwAmNqv4T9MkeThYj0mrVVl	2026-05-22 09:20:51.435	9kutn5GEWtk2N6jC3AoIYKpjYxKcJogI	2026-05-15 09:20:51.435	2026-05-15 09:20:51.435			LUYcVpz2EGKf6MkNkaYu3F540M6qZvBm
0WTNhqOTIfQBnLsp6UQV88DpENCmJUv2	2026-05-22 09:20:51.491	jumhu0YBiE4aT6xljljjNPWOV1le8Kwu	2026-05-15 09:20:51.491	2026-05-15 09:20:51.491			XK4M5qFFX4eGP23SoszmScqKqXc4XGW6
ixYgA8iZKeewQo43SaCFwyhwAfbF4Z7W	2026-05-22 09:20:51.547	EooHcTnosv0Kd7bFyUQy3S6ir073fc3a	2026-05-15 09:20:51.547	2026-05-15 09:20:51.547			jCpGeGWMVn0qGZlotVF3eYluxo166AnZ
gP2usI3ue5jt6tBkxw5oX2qgsfVdqexP	2026-05-22 09:20:51.602	CLHZJb2EZhVg4K0Ug3TlEY6NpqT2CJ4d	2026-05-15 09:20:51.602	2026-05-15 09:20:51.602			UM6VHn1NvOTKxmqwgDGLiHLXBihfQ0is
UhijMHHA71SVYzToHIU3gKuk0SdBcAKB	2026-05-22 09:20:51.659	jnvD2mNB61rYz2NOLcejPMwQPoUnkFwz	2026-05-15 09:20:51.659	2026-05-15 09:20:51.659			okRr0bHD224aYuwi8do1WLqOCphrm7qO
av5lVYiIKI6CwQkongrWcsQmbFfnK05D	2026-05-22 09:20:51.713	7uqRkjGiy3RhyYiHKSWSv8kIUz4cGZgu	2026-05-15 09:20:51.713	2026-05-15 09:20:51.713			k1NuZm9owRGOerCWCn8p7LFnJbFlRHx7
TbnvmiqepTs0GUZ5DAWaRbG18HScK84F	2026-05-22 09:20:52.795	5XK7FTG2t8JOYZRrLfmefJsToXLf1nvT	2026-05-15 09:20:52.795	2026-05-15 09:20:52.795	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	7x6pcwqX8tYlQqAnMWwbgic9E9S2Mizc
L1HHoH2OrJXwLaqsHdzxqJYXj9ix0L6h	2026-05-22 09:20:53.323	VQWTSedTSLCoFPfrd1MyZHShiKuAKBkr	2026-05-15 09:20:53.323	2026-05-15 09:20:53.323	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.96 Safari/537.36	7x6pcwqX8tYlQqAnMWwbgic9E9S2Mizc
WBqLlU7lem8t1DAYP7g3CYCCD017yWDq	2026-05-22 09:20:53.342	C3wBPwrjfL8875sCl9NPe70vrg9rFnAG	2026-05-15 09:20:53.342	2026-05-15 09:20:53.342	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.96 Safari/537.36	7x6pcwqX8tYlQqAnMWwbgic9E9S2Mizc
\.


--
-- Data for Name: ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket (id, "fromEmail", "toEmail", subject, body, status, category, summary, "agentId", "createdAt", "updatedAt", "bodyHtml") FROM stdin;
cmp6pj8de000067ql91zx4fht	reply.fwd.1778836853254@example.com	\N	Forward subject 1778836853254	Original message body.	OPEN	\N	\N	\N	2026-05-15 09:20:53.283	2026-05-15 09:20:53.283	\N
cmp6pj8dz000267qlum825jk8	reply.nodedup.1778836853247@example.com	\N	No new ticket 1778836853247	Original body.	OPEN	\N	\N	\N	2026-05-15 09:20:53.303	2026-05-15 09:20:53.303	\N
cmp6pj8dz000367qlpdc7e0kb	reply.re.1778836853248@example.com	\N	Original subject 1778836853248	Original message body.	OPEN	\N	\N	\N	2026-05-15 09:20:53.303	2026-05-15 09:20:53.303	\N
cmp6pj8f5000667ql2m4r0vby	reply.nohtml.1778836853337@example.com	\N	No HTML reply subject 1778836853337	Original plain text body.	OPEN	\N	\N	\N	2026-05-15 09:20:53.345	2026-05-15 09:20:53.345	\N
cmp6pj8fd000867qlab31lgxt	reply.html.1778836853349@example.com	\N	HTML reply subject 1778836853349	Original plain text body.	OPEN	\N	\N	\N	2026-05-15 09:20:53.353	2026-05-15 09:20:53.353	\N
cmp6pj8hq000a67ql2bhmf89v	reply.prose.1778836853424@example.com	\N	Prose render subject 1778836853424	Original plain text body.	OPEN	\N	\N	\N	2026-05-15 09:20:53.438	2026-05-15 09:20:53.438	\N
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, "deletedAt") FROM stdin;
7x6pcwqX8tYlQqAnMWwbgic9E9S2Mizc	Admin	admin@test.local	f	\N	2026-05-15 09:20:50.505	2026-05-15 09:20:50.505	ADMIN	\N
IAF4rI5zcClWN5VO1s2nhWefYnoGPRee	Jordan Lee	agent1@test.local	f	\N	2026-05-15 09:20:50.581	2026-05-15 09:20:50.581	AGENT	\N
UM6VHn1NvOTKxmqwgDGLiHLXBihfQ0is	Rachel Scott	rachel.scott@gmail.com	f	\N	2024-06-25 00:00:00	2024-06-25 00:00:00	AGENT	\N
ZU0UThqA22feA9Yxa7SH8cDzaG6Qpt8p	Alice Johnson	alice.johnson@gmail.com	f	\N	2023-01-15 00:00:00	2023-01-15 00:00:00	AGENT	\N
W0W9bQeiImNVWGFqgOpvd5S142RIgOrH	Bob Martinez	bob.martinez@gmail.com	f	\N	2023-02-20 00:00:00	2023-02-20 00:00:00	AGENT	\N
FiqA0a21Lovt2KqpPrTGkh1tfN6iv9dj	Carol Williams	carol.williams@gmail.com	f	\N	2023-03-08 00:00:00	2023-03-08 00:00:00	AGENT	\N
okRr0bHD224aYuwi8do1WLqOCphrm7qO	Samuel Turner	samuel.turner@gmail.com	f	\N	2024-07-11 00:00:00	2024-07-11 00:00:00	AGENT	\N
BNQnmg6AfYIjaZBYk40tyVZmgwJyiVkX	David Chen	david.chen@gmail.com	f	\N	2023-04-12 00:00:00	2023-04-12 00:00:00	AGENT	\N
L4qXDOaNTCESjaiD96LCqzHT2ntKIwtb	Eva Nguyen	eva.nguyen@gmail.com	f	\N	2023-05-03 00:00:00	2023-05-03 00:00:00	AGENT	\N
D1u1HwiotwCXIcOsbz1gvjJgEll5Gq0Y	Frank Patel	frank.patel@gmail.com	f	\N	2023-06-17 00:00:00	2023-06-17 00:00:00	AGENT	\N
k1NuZm9owRGOerCWCn8p7LFnJbFlRHx7	Tina Walker	tina.walker@gmail.com	f	\N	2024-08-30 00:00:00	2024-08-30 00:00:00	AGENT	\N
n5macIDAePN9JrzbFEr0flVmuhoosNWM	Grace Kim	grace.kim@gmail.com	f	\N	2023-07-22 00:00:00	2023-07-22 00:00:00	AGENT	\N
cQZGMfEhPuH8IfrNjFWOH1EDsFhAEGjv	Henry Okafor	henry.okafor@gmail.com	f	\N	2023-08-09 00:00:00	2023-08-09 00:00:00	AGENT	\N
idUO4ZClCwD2xx3qD8Z4xBh7lE9x3YiY	Isla Thompson	isla.thompson@gmail.com	f	\N	2023-09-14 00:00:00	2023-09-14 00:00:00	AGENT	\N
1M1uLUHLIocvaWFxw7BRXn1HMJYKzbru	James Rivera	james.rivera@gmail.com	f	\N	2023-10-30 00:00:00	2023-10-30 00:00:00	AGENT	\N
G1s90wFQWEfbOmYY0zOWk4oc5YWMgWSv	Karen Lee	karen.lee@gmail.com	f	\N	2023-11-05 00:00:00	2023-11-05 00:00:00	AGENT	\N
lhmEKmaoipvtd7dlbfIetIsatCPTV20L	Liam Brown	liam.brown@gmail.com	f	\N	2023-12-19 00:00:00	2023-12-19 00:00:00	AGENT	\N
nmt0Qh1HtfmpWnnpcpiEDSlrPk8n7nQX	Mia Gonzalez	mia.gonzalez@gmail.com	f	\N	2024-01-08 00:00:00	2024-01-08 00:00:00	AGENT	\N
axJqnOE1THccLyJyd4pfr0pwMJnmZmG4	Noah Davis	noah.davis@gmail.com	f	\N	2024-02-14 00:00:00	2024-02-14 00:00:00	AGENT	\N
LUYcVpz2EGKf6MkNkaYu3F540M6qZvBm	Olivia White	olivia.white@gmail.com	f	\N	2024-03-21 00:00:00	2024-03-21 00:00:00	AGENT	\N
XK4M5qFFX4eGP23SoszmScqKqXc4XGW6	Paul Harris	paul.harris@gmail.com	f	\N	2024-04-07 00:00:00	2024-04-07 00:00:00	AGENT	\N
jCpGeGWMVn0qGZlotVF3eYluxo166AnZ	Quinn Adams	quinn.adams@gmail.com	f	\N	2024-05-16 00:00:00	2024-05-16 00:00:00	AGENT	\N
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

\unrestrict 95uBObat3xFcLyG6WBmCvM34ncUCJHVpqtm9hS0dNQoDedDNqX8qmDZthAYNk0l

