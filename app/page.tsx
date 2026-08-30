"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import workItemsSource from "./work-items.generated.json";
import { chapterCopyByProject, mediaCaptionBySource } from "./project-copy";

type Slide = {
  label: string;
  kicker: string;
  title: string;
  body: string;
  layout: "cover" | "split" | "system" | "outcome";
  panel: PanelContent;
};

type WorkItem = {
  title: string;
  label: string;
  images: string[];
  videos: string[];
};

const posterForVideo = (source: string) => source.replace(/\.[^/.]+$/, "-poster.webp");
const workItemsByProject = workItemsSource as Record<string, WorkItem[]>;

type ProjectNarrative = {
  challenge: string;
  idea: string;
  system: [string, string, string];
  impact: string;
  deliverables: [string, string, string];
};

type Project = {
  id: string;
  title: string;
  en: string;
  discipline: string;
  year: string;
  role: string;
  summary: string;
  accent: string;
  accent2: string;
  rgb: string;
  image: string;
  items: WorkItem[];
  narrative: ProjectNarrative;
  slides: Slide[];
};

type PanelItem = {
  label: string;
  value: string;
};

type PanelContent = {
  eyebrow: string;
  title: string;
  summary: string;
  items: PanelItem[];
};

type Discipline = {
  id: string;
  label: string;
  en: string;
  period: string;
  count: string;
  scene: string;
  projectIds: string[];
};

const disciplines: Discipline[] = [
  { id: "system", label: "品牌整合创新", en: "BRAND · AIGC", period: "2024—2026", count: "03", scene: "/home-scenes/system.webp", projectIds: ["juewei", "aigc", "fyra"] },
  { id: "ip", label: "原创 IP 资产", en: "ORIGINAL IP", period: "2021—2024", count: "01", scene: "/home-scenes/ip.webp", projectIds: ["cloner"] },
  { id: "lifestyle", label: "海外科技品牌", en: "BRAND IDENTITY SYSTEM", period: "2021—2024", count: "01", scene: "/home-scenes/lifestyle.webp", projectIds: ["emoof"] },
  { id: "product", label: "科技 AI 产品", en: "AIGC COMMERCIALIZATION", period: "2024—2026", count: "01", scene: "/home-scenes/product.webp", projectIds: ["ace"] },
  { id: "lab", label: "创业与审美进化", en: "VISUAL EVOLUTION", period: "2011—2021", count: "03", scene: "/home-scenes/lab.webp", projectIds: ["lab", "lab-cross", "lab-ai"] },
];

const backgroundTracks = [
  { title: "ORIGINAL VIDEO TRACK", artist: "CHEN SELECTED AUDIO", src: "/music/video-original-track.m4a" },
  { title: "GEARHEAD", artist: "KEVIN MACLEOD", src: "/music/gearhead-kevin-macleod.mp3" },
  { title: "DD GROOVE", artist: "KEVIN MACLEOD", src: "/music/dd-groove-kevin-macleod.mp3" },
  { title: "BUMMIN ON TREMELO", artist: "KEVIN MACLEOD", src: "/music/bummin-on-tremelo-kevin-macleod.mp3" },
];

function StarfieldAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let lastDrawTime = 0;
    const frameInterval = 1000 / 24;

    const seeded = (index: number, salt: number) => {
      const value = Math.sin(index * 91.731 + salt * 17.193) * 43758.5453;
      return value - Math.floor(value);
    };

    const stars = Array.from({ length: 230 }, (_, index) => ({
      x: seeded(index, 1),
      y: seeded(index, 2),
      radius: 0.18 + seeded(index, 3) * (index % 29 === 0 ? 1.25 : 0.62),
      alpha: 0.08 + seeded(index, 4) * 0.42,
      pulse: seeded(index, 5) * Math.PI * 2,
      warmth: seeded(index, 6),
    }));

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawMeteor = (seconds: number, cycle: number, offset: number, lane: number) => {
      const local = ((seconds + offset) % cycle) / cycle;
      const duration = 0.032;
      if (local > duration) return;
      const progress = local / duration;
      const visibility = Math.sin(progress * Math.PI) * 0.76;
      const startX = width * (0.88 - lane * 0.14);
      const startY = height * (0.08 + lane * 0.13);
      const x = startX - width * 0.48 * progress;
      const y = startY + height * 0.25 * progress;
      const trail = 64 + width * 0.065;

      context.save();
      context.globalCompositeOperation = "screen";
      context.filter = "blur(0.55px)";
      const gradient = context.createLinearGradient(x, y, x + trail, y - trail * 0.42);
      gradient.addColorStop(0, `rgba(242, 249, 255, ${visibility * 0.78})`);
      gradient.addColorStop(0.12, `rgba(190, 222, 245, ${visibility * 0.28})`);
      gradient.addColorStop(1, "rgba(124, 177, 218, 0)");
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(x + trail * 0.52, y - trail * 0.19, x + trail, y - trail * 0.42);
      context.strokeStyle = gradient;
      context.lineWidth = 0.7;
      context.lineCap = "round";
      context.stroke();
      context.beginPath();
      context.arc(x, y, 0.8, 0, Math.PI * 2);
      context.fillStyle = `rgba(248, 252, 255, ${visibility * 0.9})`;
      context.shadowColor = "rgba(179, 221, 255, .7)";
      context.shadowBlur = 5;
      context.fill();
      context.restore();
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      if (!width || !height) return;

      const seconds = time / 1000;
      context.save();
      context.globalCompositeOperation = "screen";

      const deepSky = context.createRadialGradient(width * 0.58, height * 0.28, 0, width * 0.58, height * 0.28, width * 0.72);
      deepSky.addColorStop(0, "rgba(44, 83, 117, .055)");
      deepSky.addColorStop(0.48, "rgba(18, 48, 78, .028)");
      deepSky.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = deepSky;
      context.fillRect(0, 0, width, height);

      stars.forEach((star, index) => {
        const twinkle = 0.76 + Math.sin(seconds * (0.16 + (index % 5) * 0.025) + star.pulse) * 0.24;
        const x = star.x * width;
        const y = star.y * height;
        const color = star.warmth > 0.82 ? "255, 238, 210" : star.warmth < 0.18 ? "196, 225, 255" : "232, 241, 246";
        context.beginPath();
        context.arc(x, y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color}, ${star.alpha * twinkle})`;
        context.fill();

        if (index % 41 === 0) {
          const halo = context.createRadialGradient(x, y, 0, x, y, 7);
          halo.addColorStop(0, `rgba(${color}, ${star.alpha * twinkle * 0.18})`);
          halo.addColorStop(1, `rgba(${color}, 0)`);
          context.fillStyle = halo;
          context.fillRect(x - 7, y - 7, 14, 14);
        }
      });

      if (!motionQuery.matches) {
        drawMeteor(seconds, 37, 8.5, 0);
        drawMeteor(seconds, 53, 31, 1);
      }
      context.restore();
    };

    const animate = (time: number) => {
      if (time - lastDrawTime >= frameInterval) {
        draw(time);
        lastDrawTime = time;
      }
      if (!motionQuery.matches) frame = window.requestAnimationFrame(animate);
    };

    const restart = () => {
      window.cancelAnimationFrame(frame);
      if (motionQuery.matches) draw(0);
      else frame = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (motionQuery.matches) draw(0);
    });
    resizeObserver.observe(canvas);
    resize();
    restart();
    motionQuery.addEventListener("change", restart);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", restart);
    };
  }, []);

  return <canvas className="atmosphere-cycle" ref={canvasRef} aria-hidden="true" />;
}

const makeSlides = (projectId: string, name: string, proposition: string, projectItems?: WorkItem[]): Slide[] => {
  const templates: Omit<Slide, "panel">[] = [
    {
      label: "01 / OVERVIEW",
      kicker: "PROJECT POSITION",
      title: name,
      body: proposition,
      layout: "cover",
    },
    {
      label: "02 / IDEA",
      kicker: "CREATIVE THOUGHT",
      title: "一个清晰的核心概念，胜过素材的简单堆叠。",
      body: "这里用一句策略洞察、一句创意命题和三张关键草图，解释项目为什么这样发生。",
      layout: "split",
    },
    {
      label: "03 / SYSTEM",
      kicker: "DESIGN LANGUAGE",
      title: "让创意成为可以持续使用的视觉语法。",
      body: "展示字体、色彩、版式、影像或角色规范；每个模块独立成立，也能组合扩展。",
      layout: "system",
    },
    {
      label: "04 / IMPACT",
      kicker: "REAL-WORLD OUTPUT",
      title: "从关键画面到真实触点。",
      body: "以少量高质量场景收束案例，并补充职责、交付范围与可以公开的结果数据。",
      layout: "outcome",
    },
  ];
  const items = projectItems ?? workItemsByProject[projectId] ?? [];
  const chapterCopy = chapterCopyByProject[projectId] ?? [];
  const itemCount = Math.max(1, items.length || templates.length);
  return Array.from({ length: itemCount }, (_, index) => {
    const template = templates[index] ?? templates.at(-1)!;
    const copy = chapterCopy[index];
    return {
      ...template,
      label: index < templates.length ? template.label : `${String(index + 1).padStart(2, "0")} / DETAIL`,
      kicker: copy?.[0] ?? template.kicker,
      title: items[index]?.title ?? template.title,
      body: copy?.[1] ?? (index === 0 ? proposition : template.body),
      panel: copy ? {
        eyebrow: copy[2],
        title: copy[3],
        summary: copy[4],
        items: copy[5].map(([label, value]) => ({ label, value })),
      } : {
        eyebrow: "PROJECT BRIEF",
        title: items[index]?.title ?? name,
        summary: proposition,
        items: [
          { label: "01 / SCOPE", value: name },
          { label: "02 / CONTENT", value: items[index]?.title ?? "项目内容" },
          { label: "03 / OUTPUT", value: "视觉设计与内容交付" },
        ],
      },
    };
  });
};

const labBrandItems = workItemsByProject.lab ?? [];
const labCrossItems = workItemsByProject["lab-cross"] ?? [];
const labAiItems = workItemsByProject["lab-ai"] ?? [];

const projects: Project[] = [
  {
    id: "juewei",
    title: "绝味品牌重构",
    en: "JUEWEI REBUILD",
    discipline: "品牌整合创新",
    year: "2024—2026",
    role: "品牌策略 / 视觉统筹 / 资产管理",
    summary: "围绕品牌年轻化重构，统一视觉标准、门店体验、营销内容与艺人合作。",
    accent: "#ff4438",
    accent2: "#ff8a33",
    rgb: "255 68 56",
    image: "/works/juewei/cover.webp",
    items: workItemsByProject.juewei,
    narrative: {
      challenge: "在成熟品牌的高认知基础上，解决年轻化表达与多场景视觉不统一的问题。",
      idea: "保留品牌最有记忆度的热辣基因，用更有秩序的视觉系统重构年轻体验。",
      system: ["品牌识别与核心图形", "内容版式与影像语言", "空间、活动与消费触点"],
      impact: "把一次视觉更新沉淀为可持续调用的品牌语言，让不同团队和场景保持一致表达。",
      deliverables: ["品牌策略", "视觉系统", "场景应用"],
    },
    slides: makeSlides("juewei", "绝味品牌重构", "把一次视觉升级，转化为品牌能够长期使用的增长系统。"),
  },
  {
    id: "emoof",
    title: "品牌视觉设计",
    en: "BRAND IDENTITY SYSTEM",
    discipline: "海外科技品牌",
    year: "2021—2024",
    role: "视觉总监 / 品牌识别 / 产品与零售体验",
    summary: "以高识别品牌语言连接 3C 产品、包装、数字内容与海外零售体验。",
    accent: "#53df83",
    accent2: "#c5ff45",
    rgb: "83 223 131",
    image: "/works/emooff/cover.webp",
    items: workItemsByProject.emoof,
    narrative: {
      challenge: "科技性能容易陷入参数沟通，需要建立更鲜明、更有温度的生活方式感知。",
      idea: "用轻盈节奏和情绪化视觉，把产品能力转译成用户能够感受到的生活体验。",
      system: ["品牌识别与动态标识", "包装与产品信息层级", "数字内容与生活方式影像"],
      impact: "形成从产品、包装到数字触点一致的品牌体验，提升科技品牌的识别度与亲和力。",
      deliverables: ["品牌识别", "包装系统", "数字体验"],
    },
    slides: makeSlides("emoof", "品牌视觉设计", "让海外科技品牌在产品、空间与数字触点中保持统一识别。"),
  },
  {
    id: "aigc",
    title: "绝味 AIGC 视觉矩阵",
    en: "AIGC VISUAL MATRIX",
    discipline: "品牌整合创新",
    year: "2025—2026",
    role: "艺术指导 / AIGC 工作流 / 内容资产管理",
    summary: "以品牌规则约束生成流程，批量产出可用于视频、海报与运营场景的内容资产。",
    accent: "#ff6330",
    accent2: "#ffcf3c",
    rgb: "255 99 48",
    image: "/works/aigc/cover.webp",
    items: workItemsByProject.aigc,
    narrative: {
      challenge: "商业生成影像需要同时面对品质稳定、生产效率与跨渠道延展的问题。",
      idea: "把艺术指导原则写进生成流程，让风格不依赖偶然结果，而是能够稳定复现。",
      system: ["视觉母题与提示词规则", "生成、筛选与精修流程", "多渠道内容矩阵"],
      impact: "把单张生成图升级为可管理的内容生产链路，为持续运营提供稳定视觉资产。",
      deliverables: ["艺术指导", "AIGC 工作流", "内容矩阵"],
    },
    slides: makeSlides("aigc", "AIGC 视觉矩阵", "不是偶然生成一张好图，而是构建一条稳定产出好内容的链路。"),
  },
  {
    id: "ace",
    title: "AIGC 商业化落地",
    en: "AIGC COMMERCIALIZATION",
    discipline: "科技 AI 产品",
    year: "2026",
    role: "产品概念 / AIGC 影像 / 商业化表达",
    summary: "围绕 AI 运动相机，把产品定位、外观概念与运动影像整合为完整发布叙事。",
    accent: "#2887ff",
    accent2: "#76e4ff",
    rgb: "40 135 255",
    image: "/works/ace/cover.webp",
    items: workItemsByProject.ace,
    narrative: {
      challenge: "把复杂的产品参数转化为直观、有速度感且能够激发行动欲望的视觉体验。",
      idea: "以第一视角和真实运动情境为核心，让性能成为观众可以感受到的自由。",
      system: ["产品卖点与叙事节奏", "AIGC 场景与关键视觉", "发布内容与渠道适配"],
      impact: "建立从产品价值到发布传播的一致叙事，让技术优势变成明确的体验记忆。",
      deliverables: ["产品叙事", "发布影像", "渠道内容"],
    },
    slides: makeSlides("ace", "AIGC 商业化落地", "让生成式影像进入真实商业链路，并形成稳定的数字内容交付能力。"),
  },
  {
    id: "fyra",
    title: "品牌超级IP",
    en: "BRAND SUPER IP",
    discipline: "品牌整合创新",
    year: "2025",
    role: "角色策略 / 形象设定 / 商业应用系统",
    summary: "将绝味的热辣个性转化为“小火鸭”，并延展到门店、节庆与数字内容。",
    accent: "#ff356a",
    accent2: "#9d4cff",
    rgb: "255 53 106",
    image: "/works/fyra/cover.webp",
    items: workItemsByProject.fyra,
    narrative: {
      challenge: "角色需要摆脱单一造型展示，形成稳定性格、行为规则与持续运营能力。",
      idea: "让每个外形细节都对应一种人格线索，使角色能够被识别，也能够被持续书写。",
      system: ["角色比例与识别锚点", "表情、动作与情绪规则", "内容模板与商业应用"],
      impact: "将角色从单幅形象扩展成可以持续生产内容、适配场景并沉淀价值的 IP 资产。",
      deliverables: ["角色设定", "资产规范", "内容模板"],
    },
    slides: makeSlides("fyra", "品牌超级IP", "让角色不只可爱，更有性格、有规则，也有长期运营空间。"),
  },
  {
    id: "cloner",
    title: "IP角色设定",
    en: "IP CHARACTER SYSTEM",
    discipline: "原创 IP 资产",
    year: "2023",
    role: "世界观 / 角色系统 / 衍生与动态内容",
    summary: "从兔形角色与世界观出发，扩展运动变体、衍生产品与连续动态叙事。",
    accent: "#7a70ff",
    accent2: "#46b7ff",
    rgb: "122 112 255",
    image: "/works/cloner/cover.webp",
    items: workItemsByProject.cloner,
    narrative: {
      challenge: "原创角色需要在世界观、视觉特征与商业延展之间形成互相推动的完整关系。",
      idea: "以世界观设定角色行为，以角色行为生成故事，再由故事打开跨媒介应用。",
      system: ["世界观与角色关系", "造型、表情与叙事规则", "内容、衍生与跨媒介应用"],
      impact: "让原创形象拥有清晰的叙事支点，为内容连载和多类型合作保留生长空间。",
      deliverables: ["世界观", "角色系统", "跨媒介应用"],
    },
    slides: makeSlides("cloner", "IP角色设定", "用完整的角色系统，让视觉、衍生产品与数字影像彼此推动。"),
  },
  {
    id: "lab",
    title: "原创品牌运营",
    en: "ORIGINAL BRAND OPERATION",
    discipline: "创业与审美进化",
    year: "2011—2021",
    role: "品牌主理 / 图案研发 / 产品与零售运营",
    summary: "以 JOHN RAINBOW 完成从 300+ 原创图案到服装、展陈与内容运营的全链路实践。",
    accent: "#a45cff",
    accent2: "#ff4dcc",
    rgb: "164 92 255",
    image: "/works/lab/item-01.webp",
    items: labBrandItems,
    narrative: {
      challenge: "将持续发生的个人实验整理成可回看、可复用，也能反哺商业项目的方法库。",
      idea: "不以风格统一限制实验，而用问题意识和视觉判断建立作品之间的隐性联系。",
      system: ["品牌内容与视觉秩序", "运营节奏与表达方式", "长期积累的审美资产"],
      impact: "把持续发生的品牌实践沉淀为可复用的内容方法与视觉资产。",
      deliverables: ["品牌运营", "视觉系统", "内容资产"],
    },
    slides: makeSlides("lab", "原创品牌运营", "把持续发生的品牌实践，沉淀为可复用的内容与审美资产。", labBrandItems),
  },
  {
    id: "lab-cross",
    title: "创新审美与跨界视觉",
    en: "CROSS-DISCIPLINARY VISUALS",
    discipline: "创业与审美进化",
    year: "2011—2021",
    role: "艺术指导 / 版式与插画 / 游戏视觉实验",
    summary: "以版式、插画、IP 与游戏场景为实验场，验证视觉方法跨媒介解决问题的能力。",
    accent: "#a45cff",
    accent2: "#ff4dcc",
    rgb: "164 92 255",
    image: "/works/lab-cross/cover.webp",
    items: labCrossItems,
    narrative: {
      challenge: "将分散的形式探索整理为具有连续性的审美线索，同时保留每次实验的开放性。",
      idea: "以版式秩序连接插画、影像与跨界表达，让媒介变化成为视觉语言继续生长的动力。",
      system: ["创新视觉版式", "插画与影像实验", "跨界视觉表达"],
      impact: "形成可跨媒介迁移的审美方法，为品牌内容和个人创作提供持续更新的视觉资源。",
      deliverables: ["版式实验", "插画影像", "跨界视觉"],
    },
    slides: makeSlides("lab-cross", "创新审美与跨界视觉", "让版式、插画、影像与跨界表达共同构成持续进化的审美语言。", labCrossItems),
  },
  {
    id: "lab-ai",
    title: "AI 视觉探索",
    en: "AI VISUAL EXPLORATION",
    discipline: "创业与审美进化",
    year: "2024—2026",
    role: "AI 影像 / 动态视觉 / 生成实验",
    summary: "通过 8 组动态短片持续测试角色一致性、镜头运动与生成式叙事。",
    accent: "#a45cff",
    accent2: "#ff4dcc",
    rgb: "164 92 255",
    image: "/works/lab-ai/cover.webp",
    items: labAiItems,
    narrative: {
      challenge: "新工具快速变化，需要在技术新鲜感之外建立清晰的视觉判断和可延续的实验方向。",
      idea: "把 AI 视为视觉思考与动态测试的协作者，用连续实验寻找新的画面关系和叙事节奏。",
      system: ["生成视觉测试", "动态影像语言", "AI 辅助工作流"],
      impact: "将工具测试沉淀为新的创意方法，为后续商业影像和原创内容建立可调用的实验样本。",
      deliverables: ["AI 视觉", "动态测试", "实验样本"],
    },
    slides: makeSlides("lab-ai", "AI 视觉探索", "把 AI 与动态影像实验沉淀为可持续更新的创意方法。", labAiItems),
  },
];

const warmedImageAssets = new Set<string>();

function warmImageAsset(source: string) {
  if (typeof window === "undefined" || warmedImageAssets.has(source)) return;
  warmedImageAssets.add(source);
  const image = new Image();
  image.decoding = "async";
  image.src = source;
}

function warmDisciplineAssets(discipline: Discipline) {
  warmImageAsset(discipline.scene);
  discipline.projectIds.forEach((projectId) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    warmImageAsset(project.image);
    const firstVideo = project.items.flatMap((item) => item.videos)[0];
    if (firstVideo) warmImageAsset(posterForVideo(firstVideo));
  });
}
function getPanelContent(_project: Project, slide: Slide): PanelContent {
  return slide.panel;
}

export default function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [disciplineId, setDisciplineId] = useState("system");
  const [selectedProjectId, setSelectedProjectId] = useState("juewei");
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [focusIndex, setFocusIndex] = useState(0);
  const [infoPanel, setInfoPanel] = useState<"about" | "contact" | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [homePreviewPlaying, setHomePreviewPlaying] = useState(false);
  const [homePreviewIndex, setHomePreviewIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const homePreviewRef = useRef<HTMLVideoElement | null>(null);
  const playerDialogRef = useRef<HTMLDivElement | null>(null);
  const infoDialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const urlStateReadyRef = useRef(false);
  const videoPlayingRef = useRef(false);
  const resumeMusicAfterVideoRef = useRef(false);
  const pendingDeepLinkProjectRef = useRef<string | null>(null);
  const siteEnteredRef = useRef(false);

  const discipline = disciplines.find((item) => item.id === disciplineId) ?? disciplines[0];
  const featured = projects.find((item) => item.id === selectedProjectId) ?? projects[0];
  const homeAssetsEnabled = introLeaving || !introVisible;
  const homePreviewPlaylist = useMemo(() => {
    const seen = new Set<string>();
    return discipline.projectIds
      .flatMap((projectId) => projects.find((item) => item.id === projectId)?.items ?? [])
      .flatMap((item) => item.videos.map((src) => ({ src, title: item.title })))
      .filter(({ src }) => {
        if (seen.has(src)) return false;
        seen.add(src);
        return true;
      });
  }, [discipline]);
  const normalizedHomePreviewIndex = homePreviewPlaylist.length ? homePreviewIndex % homePreviewPlaylist.length : 0;
  const featuredPreview = homePreviewPlaylist[normalizedHomePreviewIndex] ?? null;
  const featuredPreviewSrc = featuredPreview?.src ?? null;
  const openProject = useMemo(
    () => projects.find((item) => item.id === openProjectId) ?? null,
    [openProjectId],
  );
  const activeTrack = backgroundTracks[trackIndex];
  const ringText = `${activeTrack.title} · ${activeTrack.artist} · `.repeat(2);
  const activeSlide = openProject?.slides[slideIndex] ?? null;
  const activeItem = openProject?.items[slideIndex] ?? null;
  const activeMediaCount = (activeItem?.images.length ?? 0) + (activeItem?.videos.length ?? 0);
  const activeMediaIndex = activeMediaCount > 0 ? focusIndex % activeMediaCount : 0;
  const activeMediaSources = activeItem ? [...activeItem.videos, ...activeItem.images] : [];
  const activeMediaSource = activeMediaSources[activeMediaIndex] ?? null;
  const activeMediaDescription = activeMediaSource ? mediaCaptionBySource[activeMediaSource] : null;
  const activeMediaType = activeItem && activeMediaIndex < activeItem.videos.length ? "video" : "image";
  const activeMediaTypeLabel = activeMediaType === "video" ? "动态影像" : "静态画面";
  const activeMediaDetails = [
    { label: "CONTENT / 内容主题", value: activeItem?.title ?? "作品内容" },
    { label: "MEDIA / 素材类型", value: activeMediaCount > 0 ? activeMediaTypeLabel : "暂无素材" },
    { label: "POSITION / 当前素材", value: activeMediaCount > 0 ? `第 ${activeMediaIndex + 1} 项 · 共 ${activeMediaCount} 项` : "暂无素材" },
  ];
  const activeMediaCaption = activeItem && activeMediaCount > 0
    ? `「${activeItem.title}」· ${activeMediaTypeLabel} ${activeMediaIndex + 1}/${activeMediaCount}。${activeMediaDescription ?? activeSlide?.body ?? ""}`
    : activeSlide?.body;
  const panelContent = openProject && activeSlide ? getPanelContent(openProject, activeSlide) : null;

  useEffect(() => {
    const timer = window.setTimeout(() => warmDisciplineAssets(disciplines[0]), 180);
    return () => window.clearTimeout(timer);
  }, []);

  const rememberFocus = () => {
    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };

  const restoreFocus = () => {
    window.setTimeout(() => lastFocusedRef.current?.focus(), 0);
  };

  const chooseDiscipline = (next: Discipline) => {
    warmDisciplineAssets(next);
    setDisciplineId(next.id);
    setSelectedProjectId(next.projectIds[0]);
    setHomePreviewIndex(0);
  };

  const openCase = (projectId: string) => {
    rememberFocus();
    homePreviewRef.current?.pause();
    setOpenProjectId(projectId);
    setSlideIndex(0);
    setFocusIndex(0);
    setInfoPanel(null);
  };

  const closeCase = () => {
    setOpenProjectId(null);
    restoreFocus();
  };

  const openInfo = (panel: "about" | "contact") => {
    rememberFocus();
    setInfoPanel(panel);
  };

  const closeInfo = () => {
    setInfoPanel(null);
    restoreFocus();
  };
  const enterSite = () => {
    siteEnteredRef.current = true;
    setIntroLeaving(true);
    const audio = audioRef.current;
    if (audio) {
      void audio.play().then(() => setSoundOn(true)).catch(() => setSoundOn(false));
    }
    window.setTimeout(() => {
      setIntroVisible(false);
      if (pendingDeepLinkProjectRef.current) {
        setOpenProjectId(pendingDeepLinkProjectRef.current);
        pendingDeepLinkProjectRef.current = null;
      }
    }, 720);
  };

  useEffect(() => {
    const applyLocationState = () => {
      const params = new URLSearchParams(window.location.search);
      const project = projects.find((item) => item.id === params.get("project"));
      const requestedDiscipline = disciplines.find((item) => item.id === params.get("discipline"));
      const projectDiscipline = project ? disciplines.find((item) => item.projectIds.includes(project.id)) : undefined;
      const nextDiscipline = projectDiscipline ?? requestedDiscipline;
      if (nextDiscipline) {
        setDisciplineId(nextDiscipline.id);
        setSelectedProjectId(project?.id ?? nextDiscipline.projectIds[0]);
        setHomePreviewIndex(0);
      }
      if (project) {
        const chapter = Math.max(0, Math.min(project.slides.length - 1, Number(params.get("chapter") ?? 1) - 1 || 0));
        const item = project.items[chapter];
        const mediaCount = (item?.images.length ?? 0) + (item?.videos.length ?? 0);
        const media = Math.max(0, Math.min(Math.max(0, mediaCount - 1), Number(params.get("media") ?? 1) - 1 || 0));
        if (siteEnteredRef.current) {
          pendingDeepLinkProjectRef.current = null;
          setOpenProjectId(project.id);
        } else {
          pendingDeepLinkProjectRef.current = project.id;
          setOpenProjectId(null);
        }
        setSlideIndex(chapter);
        setFocusIndex(media);
        // Keep the cover visible on initial deep links; the requested project appears after ENTER.
        setIntroLeaving(false);
      } else {
        pendingDeepLinkProjectRef.current = null;
        setOpenProjectId(null);
        setSlideIndex(0);
        setFocusIndex(0);
      }
      urlStateReadyRef.current = true;
    };

    applyLocationState();
    window.addEventListener("popstate", applyLocationState);
    return () => window.removeEventListener("popstate", applyLocationState);
  }, []);

  useEffect(() => {
    if (!urlStateReadyRef.current || introVisible) return;
    const params = new URLSearchParams();
    params.set("discipline", disciplineId);
    if (openProject) {
      params.set("project", openProject.id);
      params.set("chapter", String(slideIndex + 1));
      params.set("media", String(focusIndex + 1));
    }
    const query = params.toString();
    window.history.replaceState({ disciplineId, projectId: openProject?.id ?? null }, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, [disciplineId, focusIndex, introVisible, openProject, slideIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.46;

    const startAudio = () => {
      void audio.play().then(() => setSoundOn(true)).catch(() => setSoundOn(false));
    };
    const unlockAudio = () => {
      startAudio();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const playNextTrack = () => {
    setTrackIndex((current) => (current + 1) % backgroundTracks.length);
  };

  const handleVideoPlaybackChange = useCallback((playing: boolean) => {
    const audio = audioRef.current;

    if (playing) {
      if (!videoPlayingRef.current) {
        resumeMusicAfterVideoRef.current = Boolean(audio && !audio.paused);
      }
      videoPlayingRef.current = true;
      setVideoPlaying(true);
      audio?.pause();
      setSoundOn(false);
      return;
    }

    if (!videoPlayingRef.current) return;
    videoPlayingRef.current = false;
    setVideoPlaying(false);
    const shouldResumeMusic = resumeMusicAfterVideoRef.current;
    resumeMusicAfterVideoRef.current = false;

    if (shouldResumeMusic && audio) {
      void audio.play().then(() => setSoundOn(true)).catch(() => setSoundOn(false));
    }
  }, []);
  const advanceHomePreview = useCallback((video: HTMLVideoElement) => {
    video.pause();
    setHomePreviewPlaying(false);
    if (homePreviewPlaylist.length <= 1) return;
    setHomePreviewIndex((current) => (current + 1) % homePreviewPlaylist.length);
  }, [homePreviewPlaylist.length]);

  useEffect(() => {
    const preview = homePreviewRef.current;
    if (!preview) return;
    preview.pause();
    preview.currentTime = 0;
    setHomePreviewPlaying(false);
    if (introVisible || openProjectId || !featuredPreviewSrc) return;
    preview.muted = true;
    const timer = window.setTimeout(() => {
      void preview.play().catch(() => setHomePreviewPlaying(false));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [featuredPreviewSrc, introVisible, openProjectId]);

  const toggleSound = async () => {
    const audio = audioRef.current;
    if (!audio || videoPlaying) return;

    if (!audio.paused) {
      audio.pause();
      setSoundOn(false);
    } else {
      await audio.play();
      setSoundOn(true);
    }
  };

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !soundOn) return;
    audio.load();
    void audio.play().catch(() => setSoundOn(false));
  }, [trackIndex]);

  useEffect(() => {
    const overlayOpen = Boolean(introVisible || openProject || infoPanel);
    document.body.style.overflow = overlayOpen ? "hidden" : "";

    const onKeyDown = (event: KeyboardEvent) => {
      const activeDialog = openProject ? playerDialogRef.current : infoPanel ? infoDialogRef.current : null;
      if (event.key === "Tab" && activeDialog) {
        const focusable = Array.from(activeDialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], video[controls], [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute("hidden"));
        if (focusable.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
      if (event.key === "Escape") {
        if (openProject) closeCase();
        else if (infoPanel) closeInfo();
        return;
      }
      if (!openProject) return;
      if (event.key === "ArrowRight") {
        setFocusIndex((current) => activeMediaCount > 1 ? (current + 1) % activeMediaCount : current);
      }
      if (event.key === "ArrowLeft") {
        setFocusIndex((current) => activeMediaCount > 1 ? (current - 1 + activeMediaCount) % activeMediaCount : current);
      }
    };

    addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      removeEventListener("keydown", onKeyDown);
    };
  }, [introVisible, openProject, infoPanel, activeMediaCount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset media position when the selected chapter changes.
    setFocusIndex(0);
  }, [slideIndex]);

  const onIntroPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    event.currentTarget.style.setProperty("--intro-px", `${xRatio * 100}%`);
    event.currentTarget.style.setProperty("--intro-py", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    event.currentTarget.style.setProperty("--intro-reveal", xRatio > 0.38 ? "1" : "0");
  };

  const resetIntroHighlight = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--intro-reveal", "0");
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const x = `${xRatio * 100}%`;
    const y = `${((event.clientY - rect.top) / rect.height) * 100}%`;
    event.currentTarget.style.setProperty("--px", x);
    event.currentTarget.style.setProperty("--py", y);
  };

  return (
    <main
      className="compact-site"
      onPointerMove={onPointerMove}
      style={
        {
          "--accent": featured.accent,
          "--accent-2": featured.accent2,
          "--accent-rgb": featured.rgb,
        } as CSSProperties
      }
    >
      {introVisible && (
        <section className={`intro-screen${introLeaving ? " leaving" : ""}`} aria-label="进入陈琎作品集" onPointerMove={onIntroPointerMove} onPointerLeave={resetIntroHighlight}>
          <div className="intro-backdrop" aria-hidden="true">
            <img src="/intro-cover-default-final-v2-lossless.webp" alt="" loading="eager" fetchPriority="high" />
          </div>
          <div className="intro-subject-layer" aria-hidden="true">
            <img src="/intro-cover-default-final-v2-lossless.webp" alt="" loading="eager" fetchPriority="high" />
          </div>
          <div className="intro-profile-cover">
            <span className="sr-only">CHEN。SELF-INTRODUCTION。Hi.I am CHEN. 陈琎，设计管理 / AIGC。AI CREATIVE DIRECTOR / DESIGN MANAGER。Creative software and AI skills。</span>
            <button className="enter-button" onClick={enterSite} autoFocus>
              <strong>ENTER 进入作品集</strong>
              <b>→</b>
            </button>
          </div>
          <div className="intro-tools-repair" aria-hidden="true">
            <span className="intro-tool-tile tool-sd"><i>SD</i></span>
            <span className="intro-tool-tile tool-capcut">
              <svg viewBox="0 0 24 24"><path d="M4 7h4l12 10h-4L4 7Z" /><path d="M4 17h4L20 7h-4L4 17Z" /></svg>
            </span>
            <span className="intro-tool-tile tool-gemini"><i className="gemini-mark" /></span>
            <span className="intro-tool-tile tool-midjourney">
              <svg viewBox="0 0 64 64">
                <path d="M31 8v33" className="mj-mast" />
                <path d="M29.5 11 13 38h16.5Z" className="mj-sail-a" />
                <path d="m33.5 15 17 23h-17Z" className="mj-sail-b" />
                <path d="M11 43c6 4 11-4 17 0s11-4 17 0 9-2 9-2M12 49c6 4 11-4 17 0s11-4 17 0 8-2 8-2" className="mj-wave" />
              </svg>
            </span>
          </div>
          <footer className="intro-footer">
            <span className="intro-footer-note">*除真实头像外，本作品集中的多维跨界形象系结合个人经历，通过 AIGC 辅助进行的视觉呈现。AI 负责打破物理层面的形式边界，</span>
          </footer>
        </section>
      )}

      <header className="topbar">
        <button className="wordmark" onClick={() => chooseDiscipline(disciplines[0])} aria-label="返回作品导航首页">
          CHEN
        </button>
        <nav aria-label="网站导航">
          <button onClick={() => openInfo("about")}>个人简介</button>
          <button onClick={() => openInfo("contact")}>CONTACT</button>
        </nav>
      </header>

      <section className="impact-home" aria-label="作品类型导航">
        <audio ref={audioRef} src={activeTrack.src} preload="none" autoPlay onPlay={() => setSoundOn(true)} onPause={() => setSoundOn(false)} onEnded={playNextTrack} />
        <div className="cinematic-scenes" aria-hidden="true">
          {disciplines.map((item) => (
            <img key={item.id} className={item.id === disciplineId ? "active" : ""} src={homeAssetsEnabled && item.id === disciplineId ? item.scene : undefined} alt="" loading="lazy" decoding="async" fetchPriority={item.id === disciplineId ? "high" : "low"} />
          ))}
        </div>
        <div className="ambient-backdrop" key={`backdrop-${featured.id}`} aria-hidden="true">
          <img src={homeAssetsEnabled ? discipline.scene : undefined} alt="" loading="eager" decoding="async" fetchPriority="high" />
        </div>
        <div className="home-silhouette" aria-hidden="true">
          <img src={homeAssetsEnabled ? "/intro-portrait-clean-v3-lossless.webp" : undefined} alt="" loading="eager" decoding="async" fetchPriority="high" />
        </div>
        <StarfieldAtmosphere />
        <div className="grain" aria-hidden="true" />
        <div className="edge-code" aria-hidden="true">INDEX / 01—05 / MOVE TO EXPLORE</div>

        <div className="impact-title" aria-hidden="true">
          <span>CREATIVE</span>
          <span>WORK INDEX</span>
        </div>

        <section className={`home-video-preview${homePreviewPlaying ? " is-playing" : " is-paused"}${featuredPreview ? "" : " is-empty"}`} aria-label={`${discipline.label} 视频内容轮播预览`}>
          {featuredPreview ? (
            <video
              key={featuredPreview.src}
              ref={homePreviewRef}
              src={homeAssetsEnabled ? featuredPreview.src : undefined}
              poster={posterForVideo(featuredPreview.src)}
              preload="metadata"
              muted
              playsInline
              disablePictureInPicture
              controlsList="nofullscreen nodownload noremoteplayback"
              onPlay={() => setHomePreviewPlaying(true)}
              onPause={() => setHomePreviewPlaying(false)}
              onEnded={(event) => advanceHomePreview(event.currentTarget)}
              onDoubleClick={(event) => event.preventDefault()}
              onContextMenu={(event) => event.preventDefault()}
            />
          ) : <span className="home-video-empty" aria-hidden="true" />}
          <small>MOTION PREVIEW / {featuredPreview?.title ?? "待上传视频"}{homePreviewPlaylist.length > 1 ? ` · ${String(normalizedHomePreviewIndex + 1).padStart(2, "0")}/${String(homePreviewPlaylist.length).padStart(2, "0")}` : ""}</small>
        </section>

        <aside className="floating-disciplines">
          <span className="aside-label">SELECT A FIELD</span>
          {disciplines.map((item, index) => (
            <button
              key={item.id}
              className={item.id === disciplineId ? "active" : ""}
              onClick={() => chooseDiscipline(item)}
              onPointerEnter={() => warmDisciplineAssets(item)}
              onFocus={() => warmDisciplineAssets(item)}
              aria-pressed={item.id === disciplineId}
            >
              <span>0{index + 1}</span>
              <b>{item.label}</b>
              <small>{item.en}<em>{item.period}</em></small>
            </button>
          ))}
        </aside>

        <section className="visual-theatre" aria-live="polite">
          <div className="mirror-stage" key={`stage-${featured.id}`}>
            <button className="hero-art" onClick={() => openCase(featured.id)} aria-label={`打开 ${featured.title} 案例演示`}>
              <img src={homeAssetsEnabled ? featured.image : undefined} alt={`${featured.title} 示意视觉`} loading="eager" decoding="async" fetchPriority="high" />
              <div className="art-wash" />
              <span className="art-label">ENTER CASE</span>
              <i className="art-cross" />
            </button>
            <div className="reflection-floor" aria-hidden="true">
              <div className="art-reflection"><img src={homeAssetsEnabled ? featured.image : undefined} alt="" loading="lazy" decoding="async" fetchPriority="low" /></div>
              <div className="floor-current"><i /><i /><i /></div>
            </div>
          </div>
        </section>

        <button
          className={`sound-orbit${soundOn ? " is-playing" : ""}`}
          type="button"
          onClick={toggleSound}
          aria-label={`${soundOn ? "Pause" : "Play"} ${activeTrack.title} by ${activeTrack.artist}`}
          aria-pressed={soundOn}
          title={`${activeTrack.title} — ${activeTrack.artist}`}
        >
          <span className="sound-ring" aria-hidden="true">
            {Array.from(ringText).map((character, index) => (
              <i
                key={`${activeTrack.title}-${index}`}
                style={{ "--char-angle": `${(index / ringText.length) * 360}deg` } as CSSProperties}
              >
                {character === " " ? "\u00a0" : character}
              </i>
            ))}
          </span>
          <span className="sound-core" aria-hidden="true">
            <i className="sound-icon" />
            <small>{soundOn ? "PAUSE" : "PLAY"}</small>
          </span>
        </button>

        <aside className="impact-brief">
          <div className="brief-top"><span>{discipline.en}</span><span>{discipline.period}</span></div>
          <div className="brief-heading">
            <span>{featured.discipline}</span>
            <h1>{featured.title}</h1>
            <p>{featured.en}</p>
          </div>
          <p className="impact-summary">{featured.summary}</p>
          <div className="impact-action">
            <p><span>ROLE</span>{featured.role}</p>
            <button onClick={() => openCase(featured.id)}>
              <span className="action-label"><strong>EXPLORE</strong><small>进入项目</small></span>
              <i className="action-arrow" aria-hidden="true" />
            </button>
          </div>
        </aside>

        <div className="chapter-period">SELECTED IN THIS CHAPTER · {discipline.period}</div>
        <div className={`project-ribbon${discipline.projectIds.length > 1 ? " is-collection" : ""}`} aria-label="该章节下的代表项目">
          {discipline.projectIds.map((id) => {
            const project = projects.find((item) => item.id === id)!;
            return (
              <button
                key={project.id}
                className={project.id === featured.id ? "active" : ""}
                onClick={() => setSelectedProjectId(project.id)}
                aria-pressed={project.id === featured.id}
              >
                <b>{project.title}</b><small>{project.en}<em>{project.year}</em></small>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="home-footer">
        <span>© CHEN 2026</span>
        <span>CHANGSHA / SHENZHEN</span>
        <a href="mailto:chenjin881225@gmail.com">CHENJIN881225@GMAIL.COM</a>
        <span>AVAILABLE FOR SELECTED PROJECTS <i /></span>
      </footer>

      {infoPanel && (
        <div ref={infoDialogRef} className="info-drawer" role="dialog" aria-modal="true" aria-label={infoPanel === "about" ? "关于陈琎" : "联系陈琎"}>
          <div className="drawer-backdrop" onClick={closeInfo} />
          <section>
            <header>
              <span>{infoPanel === "about" ? "ABOUT / 个人简介" : "CONTACT / 联系方式"}</span>
              <button onClick={closeInfo} autoFocus>CLOSE ×</button>
            </header>
            {infoPanel === "about" ? (
              <div className="about-content">
                <p>AI CREATIVE DIRECTOR<br />BRAND VISUAL SYSTEM BUILDER</p>
                <h2>用审美建立秩序，<br />用系统放大创意。</h2>
                <p>我是陈琎，拥有 15 年商业视觉与设计管理经验。工作从创业品牌与审美实验，延伸到海外科技品牌、原创 IP、3C 产品叙事及 AIGC 内容生产系统。</p>
                <div><span>2013—2015<br />商业视觉基础</span><span>2015—2021<br />创业与审美进化</span><span>2021—2024<br />科技品牌与原创 IP</span><span>2024—2026<br />品牌整合与 AIGC</span></div>
              </div>
            ) : (
              <div className="contact-content">
                <p>OPEN FOR SELECTED PROJECTS</p>
                <h2>一起创造<br />下一个代表作。</h2>
                <div className="contact-details">
                  <a href="mailto:chenjin881225@gmail.com">
                    <small>EMAIL</small>
                    <strong>chenjin881225@gmail.com</strong>
                    <i>↗</i>
                  </a>
                  <div>
                    <small>WECHAT</small>
                    <strong>JOHNCH2023</strong>
                    <span>欢迎沟通设计管理、品牌升级与 AIGC 创意项目</span>
                  </div>
                </div>
                <a className="contact-cta" href="mailto:chenjin881225@gmail.com">发送邮件 <span>↗</span></a>
              </div>
            )}
          </section>
        </div>
      )}

      {openProject && (
        <div
          ref={playerDialogRef}
          className="case-player"
          role="dialog"
          aria-modal="true"
          aria-label={`${openProject.title} 案例演示`}
          style={
            {
              "--case-accent": openProject.accent,
              "--case-accent-2": openProject.accent2,
              "--case-rgb": openProject.rgb,
            } as CSSProperties
          }
        >
          <header className="player-header">
            <div className="player-project">
              <button className="player-home" onClick={closeCase} aria-label="返回作品集首页">
                <span aria-hidden="true" /> HOME
              </button>
              <div><b>{openProject.title}</b><span>{openProject.en} / {openProject.year}</span></div>
            </div>
            <p>CASE DEMO — CONTENT STRUCTURE</p>
            <div className="player-actions">
              <button
                className={`case-sound-control${soundOn ? " is-playing" : ""}${videoPlaying ? " is-video-muted" : ""}`}
                onClick={toggleSound}
                disabled={videoPlaying}
                aria-label={videoPlaying ? "视频播放中，背景音乐已自动暂停" : soundOn ? `暂停背景音乐：${activeTrack.title}` : `播放背景音乐：${activeTrack.title}`}
                title={activeTrack.title}
              >
                <span className="case-sound-bars" aria-hidden="true"><i /><i /><i /></span>
                <b>{videoPlaying ? "VIDEO" : soundOn ? "PAUSE" : "PLAY"}</b>
                <small>{videoPlaying ? "MUTED" : "MUSIC"}</small>
              </button>
              <button className="player-close" onClick={closeCase} autoFocus>CLOSE <span>×</span></button>
            </div>
          </header>

          <main className="player-main">
            <nav className="chapter-nav" aria-label="作品内容导航">
              <div className="chapter-nav-heading"><span>CONTENT INDEX</span><b>作品导航</b></div>
              {openProject.slides.map((slide, index) => {
                const item = openProject.items[index] ?? { title: "作品展示", label: `PROJECT 0${index + 1}` };
                return (
                  <button
                    key={slide.label}
                    className={index === slideIndex ? "active" : ""}
                    onClick={() => setSlideIndex(index)}
                    aria-current={index === slideIndex ? "step" : undefined}
                  >
                    <span>0{index + 1}</span>
                    <b><em>{item.title}</em><small>{item.label}</small></b>
                    <i aria-hidden="true" />
                  </button>
                );
              })}
              <p><span>{String(slideIndex + 1).padStart(2, "0")}</span> / {String(openProject.slides.length).padStart(2, "0")}</p>
            </nav>

            <section
              key={`${openProject.id}-${slideIndex}`}
              className={`slide-canvas layout-${activeSlide?.layout}`}
              aria-live="polite"
            >
              <div className="canvas-grid" aria-hidden="true" />
              <header className="slide-copy">
                <span>{activeSlide?.kicker}</span>
                <h2>{activeSlide?.title}</h2>
              </header>
              <DemoComposition
                project={openProject}
                item={activeItem ?? openProject.items[0]}
                focusIndex={focusIndex}
                onFocus={setFocusIndex}
                onVideoPlaybackChange={handleVideoPlaybackChange}
                autoRotate
              />
              <div className="stage-caption">
                <span>CURRENT VIEW · {activeMediaType === "video" ? "VIDEO" : "IMAGE"}</span>
                <p>{activeMediaCaption}</p>
              </div>
            </section>

            {panelContent && (
              <aside key={`${openProject.id}-panel-${slideIndex}`} className="project-insight">
                <div className="insight-core">
                  <header>
                    <span>{panelContent.eyebrow}</span>
                    <div><b>{String(slideIndex + 1).padStart(2, "0")}</b><small>/ {String(openProject.slides.length).padStart(2, "0")}</small></div>
                  </header>
                  <div className="insight-intro">
                    <h3>{panelContent.title}</h3>
                    <p>{panelContent.summary}</p>
                  </div>
                  <div className="insight-list" aria-label="当前素材信息">
                    {activeMediaDetails.map((item) => (
                      <div className="insight-item" key={item.label}>
                        <span>{item.label}</span>
                        <b>{item.value}</b>
                        <i aria-hidden="true">•</i>
                      </div>
                    ))}
                  </div>
                </div>
                <footer>
                  <span>DELIVERABLES</span>
                  <div>{openProject.narrative.deliverables.map((item) => <b key={item}>{item}</b>)}</div>
                </footer>
              </aside>
            )}
          </main>

          <footer className="player-footer">
            <div className="player-progress"><i style={{ width: `${activeMediaCount ? ((focusIndex + 1) / activeMediaCount) * 100 : 0}%` }} /></div>
            <span>使用 ← → 键切换当前项目内容</span>
          </footer>
        </div>
      )}
    </main>
  );
}

function DemoComposition({
  project,
  item,
  focusIndex,
  onFocus,
  onVideoPlaybackChange,
  autoRotate,
}: {
  project: Project;
  item: WorkItem;
  focusIndex: number;
  onFocus: (index: number) => void;
  onVideoPlaybackChange: (playing: boolean) => void;
  autoRotate: boolean;
}) {
  const compositionRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());
  const [assetOrientations, setAssetOrientations] = useState<Record<string, "landscape" | "portrait">>({});
  const [assetAspectRatios, setAssetAspectRatios] = useState<Record<string, number>>({});
  const [playingVideoSrc, setPlayingVideoSrc] = useState<string | null>(null);
  const [loadingVideoSrc, setLoadingVideoSrc] = useState<string | null>(null);
  const assets = [
    ...item.videos.map((src, index) => ({
      id: `video-${index + 1}`,
      src,
      poster: posterForVideo(src),
      title: item.title,
      type: "video" as const,
      orientation: "portrait" as const,
    })),
    ...item.images.map((src, index) => ({
      id: `image-${index + 1}`,
      src,
      title: item.title,
      type: "image" as const,
      orientation: "landscape" as const,
    })),
  ];
  const carouselEnabled = assets.length > 1;
  const activeAsset = assets[focusIndex] ?? assets[0];
  const [carouselPaused, setCarouselPaused] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear external video playback state when the item changes.
    setPlayingVideoSrc(null);
    setLoadingVideoSrc(null);
    onVideoPlaybackChange(false);
    return () => onVideoPlaybackChange(false);
  }, [item, onVideoPlaybackChange]);

  useEffect(() => {
    compositionRef.current?.querySelectorAll("video").forEach((video, index) => {
      if (index !== focusIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [focusIndex]);

  useEffect(() => {
    if (!autoRotate || !carouselEnabled || carouselPaused || activeAsset?.type === "video") return;
    const timer = window.setInterval(() => {
      onFocus((focusIndex + 1) % assets.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [activeAsset?.type, assets.length, autoRotate, carouselEnabled, carouselPaused, focusIndex, onFocus]);

  const moveCarousel = (direction: number) => {
    onFocus((focusIndex + direction + assets.length) % assets.length);
  };

  return (
    <div
      ref={compositionRef}
      className={`demo-composition demo-carousel${carouselEnabled ? "" : " is-single"}`}
      aria-label={`${project.title} · ${item.title} 图片与视频轮播`}
      onPointerEnter={() => setCarouselPaused(true)}
      onPointerLeave={() => setCarouselPaused(false)}
      onFocusCapture={() => setCarouselPaused(true)}
      onBlurCapture={() => setCarouselPaused(false)}
    >
      <div className="carousel-stage">
        {assets.map((asset, index) => {
          const offset = (index - focusIndex + assets.length) % assets.length;
          const position = offset === 0 ? "current" : offset === 1 ? "next" : offset === assets.length - 1 ? "previous" : "hidden";
          const shouldLoadAsset = position !== "hidden";
          const resolvedOrientation = assetOrientations[asset.src] ?? asset.orientation;
          const resolvedAspectRatio = assetAspectRatios[asset.src] ?? (resolvedOrientation === "portrait" ? 9 / 16 : 16 / 9);
          return (
            <article
              key={asset.id}
              className={`carousel-slide is-${position} orientation-${resolvedOrientation} is-${asset.type}`}
              style={{ "--asset-ratio": resolvedAspectRatio } as CSSProperties}
              onClick={() => onFocus(index)}
              aria-label={`查看${item.title}第 ${index + 1} 项内容`}
              aria-hidden={position === "hidden"}
            >
              <div className="carousel-media">
                {asset.type === "image" ? (
                  <img
                    src={shouldLoadAsset ? asset.src : undefined}
                    alt=""
                    loading={position === "current" ? "eager" : "lazy"}
                    fetchPriority={position === "current" ? "high" : "low"}
                    decoding="async"
                    onLoad={(event) => {
                      const image = event.currentTarget;
                      const orientation = image.naturalHeight > image.naturalWidth ? "portrait" : "landscape";
                      const aspectRatio = image.naturalWidth / image.naturalHeight;
                      setAssetOrientations((current) => current[asset.src] === orientation
                        ? current
                        : { ...current, [asset.src]: orientation });
                      setAssetAspectRatios((current) => current[asset.src] === aspectRatio
                        ? current
                        : { ...current, [asset.src]: aspectRatio });
                    }}
                  />
                ) : (
                  <div className={`carousel-video${playingVideoSrc === asset.src ? " is-playing" : " is-paused"}${loadingVideoSrc === asset.src ? " is-loading" : ""}`}>
                    <video
                      ref={(node) => {
                        if (node) videoRefs.current.set(asset.src, node);
                        else videoRefs.current.delete(asset.src);
                      }}
                      src={shouldLoadAsset ? asset.src : undefined}
                      poster={asset.poster}
                      playsInline
                      preload={position === "current" ? "metadata" : "none"}
                      onWaiting={() => setLoadingVideoSrc(asset.src)}
                      onCanPlay={() => setLoadingVideoSrc((current) => current === asset.src ? null : current)}
                      onPlaying={() => setLoadingVideoSrc((current) => current === asset.src ? null : current)}
                      onError={() => setLoadingVideoSrc((current) => current === asset.src ? null : current)}
                      onPlay={(event) => {
                        videoRefs.current.forEach((video) => {
                          if (video !== event.currentTarget) video.pause();
                        });
                        setLoadingVideoSrc(null);
                        setPlayingVideoSrc(asset.src);
                        setCarouselPaused(true);
                        onVideoPlaybackChange(true);
                      }}
                      onPause={() => {
                        setLoadingVideoSrc((current) => current === asset.src ? null : current);
                        setPlayingVideoSrc((current) => current === asset.src ? null : current);
                        setCarouselPaused(false);
                        onVideoPlaybackChange(false);
                      }}
                      onEnded={() => {
                        setLoadingVideoSrc(null);
                        setPlayingVideoSrc(null);
                        setCarouselPaused(false);
                        onVideoPlaybackChange(false);
                      }}
                      onLoadedMetadata={(event) => {
                        const video = event.currentTarget;
                        const orientation = video.videoHeight > video.videoWidth ? "portrait" : "landscape";
                        const aspectRatio = video.videoWidth / video.videoHeight;
                        setAssetOrientations((current) => current[asset.src] === orientation
                          ? current
                          : { ...current, [asset.src]: orientation });
                        setAssetAspectRatios((current) => current[asset.src] === aspectRatio
                          ? current
                          : { ...current, [asset.src]: aspectRatio });
                      }}
                    />
                    <button
                      className="video-toggle"
                      type="button"
                      disabled={position !== "current"}
                      tabIndex={position === "current" ? 0 : -1}
                      aria-label={loadingVideoSrc === asset.src ? "视频加载中" : playingVideoSrc === asset.src ? "暂停视频" : "播放视频"}
                      onClick={(event) => {
                        event.stopPropagation();
                        const video = videoRefs.current.get(asset.src);
                        if (!video) return;
                        if (video.paused) {
                          setLoadingVideoSrc(asset.src);
                          void video.play().catch(() => setLoadingVideoSrc(null));
                        } else {
                          video.pause();
                        }
                      }}
                    >
                      <span aria-hidden="true" />
                    </button>
                  </div>
                )}
                <span>{asset.title} / {String(index + 1).padStart(2, "0")} OF {String(assets.length).padStart(2, "0")} · {asset.type === "video" ? "VIDEO" : "IMAGE"}</span>
              </div>
            </article>
          );
        })}
      </div>
      {carouselEnabled && (
        <div className="carousel-controls" aria-label="切换当前项目内容">
          <button className="carousel-arrow is-prev" type="button" onClick={() => moveCarousel(-1)} aria-label="上一项当前项目内容"><span aria-hidden="true" /></button>
          <button className="carousel-arrow is-next" type="button" onClick={() => moveCarousel(1)} aria-label="下一项当前项目内容"><span aria-hidden="true" /></button>
        </div>
      )}
    </div>
  );
}
