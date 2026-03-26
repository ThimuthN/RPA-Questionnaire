import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

import { deckMeta, slides } from "./rpa-day2-deck-data.mjs";

const pptx = { ShapeType: new pptxgen().ShapeType };

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const exportsDir = path.join(rootDir, "exports");
const pptxPath = path.join(exportsDir, "day2-how-rpa-works-innobot.pptx");
const outlinePath = path.join(exportsDir, "day2-how-rpa-works-innobot-outline.md");

const COLORS = {
  ink: "050B16",
  navy: "0A1830",
  navy2: "102749",
  blue: "1F6FFF",
  blueSoft: "8AB8FF",
  teal: "12B3A8",
  slateBg: "F4F7FB",
  slateLine: "C7D5EA",
  text: "102749",
  textSoft: "51607B",
  white: "FFFFFF",
  amber: "E6A019",
  crimson: "D6455D"
};

const FONT_HEAD = "Aptos Display";
const FONT_BODY = "Aptos";
const FONT_MONO = "Consolas";

function addBackground(slide, mode = "light") {
  if (mode === "dark") {
    slide.background = { color: COLORS.ink };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      fill: { color: COLORS.ink }
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: -0.2,
      y: -0.9,
      w: 4.4,
      h: 3.2,
      line: { color: COLORS.blue, transparency: 100 },
      fill: { color: COLORS.blue, transparency: 78 }
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 9.4,
      y: -0.8,
      w: 4.3,
      h: 3.4,
      line: { color: COLORS.teal, transparency: 100 },
      fill: { color: COLORS.teal, transparency: 84 }
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 8.4,
      y: 5.9,
      w: 5.3,
      h: 1.9,
      rotate: 8,
      line: { color: COLORS.blueSoft, transparency: 100 },
      fill: { color: COLORS.blueSoft, transparency: 92 }
    });
    return;
  }

  slide.background = { color: COLORS.slateBg };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: COLORS.slateBg }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.45,
    fill: { color: COLORS.navy }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 10.4,
    y: -0.15,
    w: 3.5,
    h: 2.4,
    line: { color: COLORS.blueSoft, transparency: 100 },
    fill: { color: COLORS.blueSoft, transparency: 84 }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: -0.8,
    y: 5.9,
    w: 2.8,
    h: 1.8,
    line: { color: COLORS.teal, transparency: 100 },
    fill: { color: COLORS.teal, transparency: 90 }
  });
}

function addHeader(slide, title, subtitle, section, slideNumber) {
  slide.addText(section.toUpperCase(), {
    x: 0.72,
    y: 0.2,
    w: 2.9,
    h: 0.16,
    fontFace: FONT_BODY,
    fontSize: 8.5,
    color: COLORS.blueSoft,
    bold: true,
    charSpace: 1.2,
    margin: 0
  });
  slide.addText(title, {
    x: 0.72,
    y: 0.67,
    w: 7.9,
    h: 0.45,
    fontFace: FONT_HEAD,
    fontSize: 24,
    bold: true,
    color: COLORS.text,
    margin: 0
  });
  slide.addText(subtitle, {
    x: 0.72,
    y: 1.17,
    w: 8.6,
    h: 0.34,
    fontFace: FONT_BODY,
    fontSize: 11,
    color: COLORS.textSoft,
    margin: 0
  });
  slide.addText(`${slideNumber}`.padStart(2, "0"), {
    x: 12.2,
    y: 0.58,
    w: 0.4,
    h: 0.22,
    fontFace: FONT_MONO,
    fontSize: 9.5,
    color: COLORS.textSoft,
    align: "right",
    margin: 0
  });
}

function addTakeaway(slide, text, opts = {}) {
  const { x = 9.15, y = 0.74, w = 3.45, h = 0.9, tone = "blue" } = opts;
  const accent = tone === "teal" ? COLORS.teal : COLORS.blue;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    line: { color: accent, transparency: 100 },
    fill: { color: COLORS.white }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h,
    line: { color: accent, transparency: 100 },
    fill: { color: accent }
  });
  slide.addText("Key takeaway", {
    x: x + 0.18,
    y: y + 0.12,
    w: 1.2,
    h: 0.18,
    fontFace: FONT_BODY,
    fontSize: 8,
    bold: true,
    color: accent,
    margin: 0
  });
  slide.addText(text, {
    x: x + 0.18,
    y: y + 0.28,
    w: w - 0.3,
    h: h - 0.33,
    fontFace: FONT_BODY,
    fontSize: 9.2,
    color: COLORS.text,
    margin: 0.02,
    valign: "mid"
  });
}

function addFooter(slide) {
  slide.addText("Innobot  |  Internal workshop", {
    x: 0.72,
    y: 7.12,
    w: 2.8,
    h: 0.18,
    fontFace: FONT_BODY,
    fontSize: 8.5,
    color: COLORS.textSoft,
    margin: 0
  });
}

function addBulletList(slide, items, x, y, w, options = {}) {
  const {
    fontSize = 11,
    bulletColor = COLORS.blue,
    textColor = COLORS.text,
    lineGap = 0.52
  } = options;

  items.forEach((item, index) => {
    const yPos = y + index * lineGap;
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: yPos + 0.08,
      w: 0.11,
      h: 0.11,
      line: { color: bulletColor, transparency: 100 },
      fill: { color: bulletColor }
    });
    slide.addText(item, {
      x: x + 0.18,
      y: yPos,
      w,
      h: 0.33,
      fontFace: FONT_BODY,
      fontSize,
      color: textColor,
      margin: 0
    });
  });
}

function addCard(slide, { x, y, w, h, title, body, accent = COLORS.blue, dark = false, bodySize = 9.4 }) {
  const fill = dark ? COLORS.navy : COLORS.white;
  const titleColor = dark ? COLORS.white : COLORS.text;
  const bodyColor = dark ? "D9E5F5" : COLORS.textSoft;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.06,
    line: { color: dark ? COLORS.navy2 : COLORS.slateLine, pt: 1 },
    fill: { color: fill }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.07,
    line: { color: accent, transparency: 100 },
    fill: { color: accent }
  });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.3,
    h: 0.22,
    fontFace: FONT_HEAD,
    fontSize: 11.5,
    bold: true,
    color: titleColor,
    margin: 0
  });
  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.48,
    w: w - 0.3,
    h: h - 0.58,
    fontFace: FONT_BODY,
    fontSize: bodySize,
    color: bodyColor,
    margin: 0.02,
    valign: "top"
  });
}

function addCallout(slide, callout, x, y, w, h, tone = "amber") {
  if (!callout) return;
  const accent =
    tone === "crimson" ? COLORS.crimson : tone === "teal" ? COLORS.teal : COLORS.amber;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.05,
    line: { color: accent, pt: 1.2 },
    fill: { color: "FFF9EE" }
  });
  slide.addText(callout.title, {
    x: x + 0.18,
    y: y + 0.14,
    w: w - 0.3,
    h: 0.18,
    fontFace: FONT_BODY,
    fontSize: 8.5,
    color: accent,
    bold: true,
    margin: 0
  });
  slide.addText(callout.body, {
    x: x + 0.18,
    y: y + 0.33,
    w: w - 0.3,
    h: h - 0.38,
    fontFace: FONT_BODY,
    fontSize: 9.4,
    color: COLORS.text,
    margin: 0.02,
    valign: "mid"
  });
}

function addFlowRow(slide, steps, x, y, w, h, options = {}) {
  const gap = options.gap ?? 0.18;
  const boxW = (w - gap * (steps.length - 1)) / steps.length;
  steps.forEach((step, index) => {
    const left = x + index * (boxW + gap);
    slide.addShape(pptx.ShapeType.roundRect, {
      x: left,
      y,
      w: boxW,
      h,
      rectRadius: 0.05,
      line: { color: COLORS.slateLine, pt: 1 },
      fill: { color: index % 2 === 0 ? COLORS.white : "EEF4FB" }
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: left + 0.14,
      y: y + 0.12,
      w: 0.25,
      h: 0.25,
      line: { color: COLORS.blue, transparency: 100 },
      fill: { color: COLORS.blue }
    });
    slide.addText(String(index + 1), {
      x: left + 0.14,
      y: y + 0.12,
      w: 0.25,
      h: 0.18,
      fontFace: FONT_BODY,
      fontSize: 8.5,
      bold: true,
      color: COLORS.white,
      align: "center",
      margin: 0
    });
    slide.addText(step, {
      x: left + 0.48,
      y: y + 0.1,
      w: boxW - 0.6,
      h: h - 0.15,
      fontFace: FONT_BODY,
      fontSize: 9.1,
      color: COLORS.text,
      margin: 0.01,
      valign: "mid"
    });
    if (index < steps.length - 1) {
      slide.addShape(pptx.ShapeType.chevron, {
        x: left + boxW + 0.03,
        y: y + h / 2 - 0.12,
        w: 0.12,
        h: 0.24,
        line: { color: COLORS.teal, transparency: 100 },
        fill: { color: COLORS.teal }
      });
    }
  });
}

function addShapeWithBullets(slide, bullets, x, y, w, h) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.05,
    line: { color: COLORS.slateLine, pt: 1 },
    fill: { color: COLORS.white }
  });
  addBulletList(slide, bullets, x + 0.2, y + 0.2, w - 0.45, { fontSize: 9.65, lineGap: 0.23 });
}

function renderCover(slide, data) {
  addBackground(slide, "dark");
  slide.addText("INNOBOT  |  INTERNAL WORKSHOP", {
    x: 0.8,
    y: 0.52,
    w: 3.7,
    h: 0.18,
    fontFace: FONT_BODY,
    fontSize: 10,
    color: COLORS.blueSoft,
    bold: true,
    charSpace: 1.2,
    margin: 0
  });
  slide.addText(data.title, {
    x: 0.8,
    y: 1.02,
    w: 5.9,
    h: 0.62,
    fontFace: FONT_HEAD,
    fontSize: 27,
    bold: true,
    color: COLORS.white,
    margin: 0
  });
  slide.addText(data.subtitle, {
    x: 0.8,
    y: 1.82,
    w: 5.8,
    h: 0.7,
    fontFace: FONT_BODY,
    fontSize: 12.5,
    color: "D7E7FF",
    margin: 0.02
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 2.72,
    w: 5.65,
    h: 1.06,
    rectRadius: 0.05,
    line: { color: COLORS.blueSoft, transparency: 78 },
    fill: { color: COLORS.navy2, transparency: 15 }
  });
  slide.addText(data.takeaway, {
    x: 1.02,
    y: 2.96,
    w: 5.2,
    h: 0.62,
    fontFace: FONT_BODY,
    fontSize: 11.2,
    color: COLORS.white,
    margin: 0
  });

  const agendaY = 4.12;
  data.agenda.forEach((item, index) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8 + (index % 2) * 2.9,
      y: agendaY + Math.floor(index / 2) * 0.58,
      w: 2.68,
      h: 0.42,
      rectRadius: 0.04,
      line: { color: COLORS.blueSoft, transparency: 84 },
      fill: { color: index % 2 === 0 ? COLORS.navy2 : COLORS.navy, transparency: 10 }
    });
    slide.addText(item, {
      x: 0.97 + (index % 2) * 2.9,
      y: agendaY + 0.1 + Math.floor(index / 2) * 0.58,
      w: 2.3,
      h: 0.18,
      fontFace: FONT_BODY,
      fontSize: 9.2,
      color: COLORS.white,
      margin: 0
    });
  });

  addCard(slide, {
    x: 7.15,
    y: 1.08,
    w: 5.15,
    h: 1.15,
    title: "End-to-end delivery view",
    body: "Dispatcher collects and structures workload. Availity Performer processes one claim at a time. ECW Performer finalizes updates and summary reporting.",
    accent: COLORS.teal,
    dark: true,
    bodySize: 9.6
  });
  addCard(slide, {
    x: 7.15,
    y: 2.48,
    w: 1.45,
    h: 1.18,
    title: "Trigger",
    body: "Schedule or event starts a controlled run.",
    accent: COLORS.blue,
    dark: true,
    bodySize: 8.8
  });
  addCard(slide, {
    x: 8.92,
    y: 2.48,
    w: 1.6,
    h: 1.18,
    title: "Queue",
    body: "Structured transactions, retries, and state tracking.",
    accent: COLORS.teal,
    dark: true,
    bodySize: 8.6
  });
  addCard(slide, {
    x: 10.82,
    y: 2.48,
    w: 1.48,
    h: 1.18,
    title: "Output",
    body: "Updates, reports, screenshots, and review signals.",
    accent: COLORS.blueSoft,
    dark: true,
    bodySize: 8.6
  });
}

function renderCardsLeft(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway);
  addBulletList(slide, data.bullets, 0.8, 1.9, 7.6, { fontSize: 11.1, lineGap: 0.63 });
  data.cards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: 9.0,
      y: 1.95 + cardIndex * 1.55,
      w: 3.55,
      h: 1.24,
      title: card.title,
      body: card.body,
      accent: cardIndex === 1 ? COLORS.teal : COLORS.blue
    });
  });
  addFooter(slide);
}

function renderRecap(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: "teal" });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.78,
    y: 1.92,
    w: 7.62,
    h: 3.55,
    rectRadius: 0.05,
    line: { color: COLORS.slateLine, pt: 1 },
    fill: { color: COLORS.white }
  });
  addBulletList(slide, data.bullets, 1.02, 2.18, 6.95, { fontSize: 10.8, lineGap: 0.72 });
  data.cards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: 8.95,
      y: 1.95 + cardIndex * 1.25,
      w: 3.58,
      h: 0.98,
      title: card.title,
      body: card.body,
      accent: cardIndex === 1 ? COLORS.teal : COLORS.blue,
      bodySize: 8.8
    });
  });
  addCallout(
    slide,
    {
      title: "Bridge To Day 2",
      body: "Process understanding from Day 1 becomes runtime control and support design in Day 2."
    },
    0.82,
    5.74,
    11.65,
    0.74,
    "teal"
  );
  addFooter(slide);
}

function renderRuntimeFlow(slide, data, index) {
  addBackground(slide);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.45,
    w: 13.333,
    h: 0.16,
    fill: { color: COLORS.blue }
  });
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway);
  addFlowRow(slide, data.flow, 0.8, 1.95, 11.75, 0.62, { gap: 0.12 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 3.02,
    w: 8.32,
    h: 2.6,
    rectRadius: 0.05,
    line: { color: COLORS.slateLine, pt: 1 },
    fill: { color: COLORS.white }
  });
  addBulletList(slide, data.bullets, 1.02, 3.28, 7.6, { fontSize: 10.6, lineGap: 0.6 });
  addCallout(slide, data.callout, 9.42, 3.08, 3.08, 1.16);
  addCard(slide, {
    x: 9.42,
    y: 4.52,
    w: 3.08,
    h: 1.04,
    title: "Operational view",
    body: "The run must remain visible, recoverable, and cleanly closed after every execution.",
    accent: COLORS.teal,
    bodySize: 9
  });
  addFooter(slide);
}

function renderFourPillars(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: "teal" });
  data.pillars.forEach((pillar, pillarIndex) => {
    addCard(slide, {
      x: 0.82 + pillarIndex * 3.07,
      y: 1.95,
      w: 2.82,
      h: 2.2,
      title: pillar.title,
      body: pillar.body,
      accent: pillarIndex % 2 === 0 ? COLORS.blue : COLORS.teal,
      bodySize: 9.5
    });
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.82,
    y: 4.55,
    w: 11.7,
    h: 1.45,
    rectRadius: 0.05,
    line: { color: COLORS.slateLine, pt: 1 },
    fill: { color: COLORS.white }
  });
  addBulletList(slide, data.bullets, 1.02, 4.82, 10.95, { fontSize: 10.2, lineGap: 0.46 });
  addFooter(slide);
}

function renderModeSlide(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: data.mode === "Attended" ? "teal" : "blue" });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.82,
    y: 1.92,
    w: 7.28,
    h: 4.15,
    rectRadius: 0.05,
    line: { color: COLORS.slateLine, pt: 1 },
    fill: { color: COLORS.white }
  });
  slide.addShape(
    data.mode === "Attended" ? pptx.ShapeType.flowChartManualInput : pptx.ShapeType.flowChartTerminator,
    {
      x: 0.98,
      y: 2.15,
      w: 1.1,
      h: 0.7,
      line: { color: COLORS.blue, pt: 1.4 },
      fill: { color: "EEF4FB" }
    }
  );
  slide.addText(data.mode, {
    x: 1.12,
    y: 2.38,
    w: 0.8,
    h: 0.18,
    fontFace: FONT_BODY,
    fontSize: 9.6,
    bold: true,
    color: COLORS.text,
    align: "center",
    margin: 0
  });
  addBulletList(slide, data.bullets, 1.12, 3.0, 6.45, { fontSize: 10.65, lineGap: 0.58 });
  data.cards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: 8.55,
      y: 2.0 + cardIndex * 1.4,
      w: 3.92,
      h: 1.08,
      title: card.title,
      body: card.body,
      accent: cardIndex === 1 ? COLORS.teal : COLORS.blue,
      bodySize: 8.9
    });
  });
  addFooter(slide);
}

function renderComparison(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway);

  const tableX = 0.82;
  const tableY = 1.92;
  const colWidths = [2.65, 4.18, 4.35];
  const rowHeight = 0.62;
  const headers = ["Decision Area", "Attended", "Unattended"];

  let x = tableX;
  headers.forEach((header, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: tableY,
      w: colWidths[i],
      h: rowHeight,
      line: { color: COLORS.navy, pt: 1 },
      fill: { color: i === 0 ? COLORS.navy2 : COLORS.navy }
    });
    slide.addText(header, {
      x: x + 0.12,
      y: tableY + 0.18,
      w: colWidths[i] - 0.2,
      h: 0.18,
      fontFace: FONT_BODY,
      fontSize: 10,
      bold: true,
      color: COLORS.white,
      margin: 0
    });
    x += colWidths[i];
  });

  data.comparisonRows.forEach((row, rowIndex) => {
    let colX = tableX;
    row.forEach((cell, colIndex) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: colX,
        y: tableY + rowHeight * (rowIndex + 1),
        w: colWidths[colIndex],
        h: rowHeight,
        line: { color: COLORS.slateLine, pt: 1 },
        fill: { color: rowIndex % 2 === 0 ? COLORS.white : "EEF4FB" }
      });
      slide.addText(cell, {
        x: colX + 0.1,
        y: tableY + rowHeight * (rowIndex + 1) + 0.13,
        w: colWidths[colIndex] - 0.16,
        h: 0.3,
        fontFace: FONT_BODY,
        fontSize: 9.1,
        color: colIndex === 0 ? COLORS.text : COLORS.textSoft,
        bold: colIndex === 0,
        margin: 0
      });
      colX += colWidths[colIndex];
    });
  });

  addCallout(slide, data.callout, 0.82, 6.48, 11.72, 0.72, "teal");
  addFooter(slide);
}

function renderOrchestration(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: "teal" });
  addCard(slide, {
    x: 4.85,
    y: 2.1,
    w: 3.55,
    h: 1.15,
    title: "Orchestration Hub",
    body: "The control layer coordinating schedules, queues, credentials, visibility, and recovery.",
    accent: COLORS.blue
  });
  const positions = [
    [1.0, 2.05],
    [9.05, 2.05],
    [1.0, 3.62],
    [9.05, 3.62]
  ];
  data.cards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: positions[cardIndex][0],
      y: positions[cardIndex][1],
      w: 3.1,
      h: 1.12,
      title: card.title,
      body: card.body,
      accent: cardIndex % 2 === 0 ? COLORS.blue : COLORS.teal,
      bodySize: 8.7
    });
  });
  addShapeWithBullets(slide, data.bullets.slice(0, 3), 0.82, 5.22, 7.95, 1.1);
  addCallout(slide, data.callout, 9.02, 5.22, 3.48, 1.1, "amber");
  addFooter(slide);
}

function renderPipeline(slide, data, index) {
  addBackground(slide);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.45,
    w: 13.333,
    h: 0.16,
    fill: { color: COLORS.teal }
  });
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: "teal" });

  const stageX = [0.82, 4.38, 7.94];
  data.pipelineStages.forEach((stage, stageIndex) => {
    addCard(slide, {
      x: stageX[stageIndex],
      y: 2.05,
      w: 2.98,
      h: 1.95,
      title: stage.title,
      body: stage.body,
      accent: stageIndex === 1 ? COLORS.teal : COLORS.blue,
      bodySize: 9.2
    });
  });

  addCard(slide, {
    x: 11.02,
    y: 2.05,
    w: 1.46,
    h: 0.88,
    title: "Logs",
    body: "Run evidence",
    accent: COLORS.blue,
    bodySize: 8.2
  });
  addCard(slide, {
    x: 11.02,
    y: 3.05,
    w: 1.46,
    h: 0.88,
    title: "Review",
    body: "Human visibility",
    accent: COLORS.teal,
    bodySize: 8.2
  });
  addCard(slide, {
    x: 11.02,
    y: 4.05,
    w: 1.46,
    h: 0.88,
    title: "Reports",
    body: "Measured outputs",
    accent: COLORS.amber,
    bodySize: 8.2
  });
  addShapeWithBullets(slide, data.bullets, 0.82, 4.55, 9.96, 1.45);
  addFooter(slide);
}

function renderWorkflowDetail(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: "teal" });
  addFlowRow(slide, data.flow, 0.82, 1.98, 8.2, 0.66, { gap: 0.1 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.82,
    y: 3.0,
    w: 8.2,
    h: 2.7,
    rectRadius: 0.05,
    line: { color: COLORS.slateLine, pt: 1 },
    fill: { color: COLORS.white }
  });
  addBulletList(slide, data.bullets, 1.02, 3.26, 7.5, { fontSize: 10.3, lineGap: 0.58 });
  data.cards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: 9.35,
      y: 1.98 + cardIndex * 1.3,
      w: 3.15,
      h: 0.98,
      title: card.title,
      body: card.body,
      accent: cardIndex === 1 ? COLORS.teal : COLORS.blue,
      bodySize: 8.7
    });
  });
  addFooter(slide);
}

function renderREFramework(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway);

  const loopCards = [
    { x: 1.15, y: 2.25, title: "Initialize", body: data.flow[0] },
    { x: 3.55, y: 2.25, title: "Get Transaction", body: data.flow[1] },
    { x: 6.0, y: 2.25, title: "Process Transaction", body: `${data.flow[2]} ${data.flow[3]}` },
    { x: 8.63, y: 2.25, title: "Decision", body: `${data.flow[4]} ${data.flow[5]}` }
  ];
  loopCards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: card.x,
      y: card.y,
      w: cardIndex === 2 ? 2.32 : 2.1,
      h: 1.2,
      title: card.title,
      body: card.body,
      accent: cardIndex % 2 === 0 ? COLORS.blue : COLORS.teal,
      bodySize: 8.5
    });
  });

  slide.addShape(pptx.ShapeType.curvedLeftArrow, {
    x: 9.55,
    y: 3.6,
    w: 2.3,
    h: 1.35,
    line: { color: COLORS.teal, pt: 1.2 },
    fill: { color: COLORS.teal, transparency: 72 }
  });
  slide.addText("Continue with next claim", {
    x: 9.92,
    y: 4.08,
    w: 1.45,
    h: 0.26,
    fontFace: FONT_BODY,
    fontSize: 8.7,
    color: COLORS.text,
    bold: true,
    margin: 0,
    align: "center"
  });

  addShapeWithBullets(slide, data.bullets, 0.82, 4.92, 8.3, 1.18);
  addCallout(slide, data.callout, 9.35, 5.02, 3.18, 1.06, "teal");
  addFooter(slide);
}

function renderTimeline(slide, data, index) {
  addBackground(slide);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.45,
    w: 13.333,
    h: 0.16,
    fill: { color: COLORS.blue }
  });
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway);
  data.timeline.forEach((item, itemIndex) => {
    const x = 0.92 + itemIndex * 1.62;
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: 2.86,
      w: 0.45,
      h: 0.45,
      line: { color: COLORS.blue, pt: 1.4 },
      fill: { color: itemIndex % 2 === 0 ? COLORS.white : "EAF6F4" }
    });
    slide.addText(item.title, {
      x: x - 0.22,
      y: 2.27,
      w: 0.92,
      h: 0.18,
      fontFace: FONT_HEAD,
      fontSize: 10,
      bold: true,
      color: COLORS.text,
      align: "center",
      margin: 0
    });
    slide.addText(item.body, {
      x: x - 0.45,
      y: 3.45,
      w: 1.35,
      h: 0.72,
      fontFace: FONT_BODY,
      fontSize: 8.2,
      color: COLORS.textSoft,
      align: "center",
      margin: 0.02
    });
  });
  addShapeWithBullets(slide, data.bullets, 0.82, 5.45, 11.75, 0.95);
  addFooter(slide);
}

function renderBARole(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: "teal" });
  const phases = ["Assess", "Design", "Build", "Test", "Operate"];
  phases.forEach((phase, phaseIndex) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.82 + phaseIndex * 2.22,
      y: 1.95,
      w: 1.9,
      h: 0.55,
      rectRadius: 0.05,
      line: { color: COLORS.navy, transparency: 100 },
      fill: { color: phaseIndex % 2 === 0 ? COLORS.navy : COLORS.navy2 }
    });
    slide.addText(phase, {
      x: 0.82 + phaseIndex * 2.22,
      y: 2.11,
      w: 1.9,
      h: 0.16,
      fontFace: FONT_BODY,
      fontSize: 9.2,
      color: COLORS.white,
      bold: true,
      align: "center",
      margin: 0
    });
  });
  data.cards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: 0.82 + (cardIndex % 2) * 4.18 + Math.floor(cardIndex / 2) * 0.12,
      y: 2.95 + Math.floor(cardIndex / 2) * 1.55,
      w: 3.95,
      h: 1.2,
      title: card.title,
      body: card.body,
      accent: cardIndex % 2 === 0 ? COLORS.blue : COLORS.teal,
      bodySize: 8.9
    });
  });
  addBulletList(slide, data.bullets, 8.95, 2.95, 3.25, { fontSize: 9.9, lineGap: 0.56 });
  addCallout(slide, data.callout, 8.95, 5.38, 3.4, 0.92, "crimson");
  addFooter(slide);
}

function renderExceptions(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway);
  data.exceptionColumns.forEach((column, columnIndex) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.82 + columnIndex * 5.98,
      y: 1.95,
      w: 5.55,
      h: 2.55,
      rectRadius: 0.05,
      line: { color: COLORS.slateLine, pt: 1 },
      fill: { color: COLORS.white }
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.82 + columnIndex * 5.98,
      y: 1.95,
      w: 5.55,
      h: 0.08,
      line: { color: columnIndex === 0 ? COLORS.teal : COLORS.crimson, transparency: 100 },
      fill: { color: columnIndex === 0 ? COLORS.teal : COLORS.crimson }
    });
    slide.addText(column.title, {
      x: 1.0 + columnIndex * 5.98,
      y: 2.15,
      w: 5.15,
      h: 0.2,
      fontFace: FONT_HEAD,
      fontSize: 12,
      bold: true,
      color: COLORS.text,
      margin: 0
    });
    addBulletList(slide, column.points, 1.02 + columnIndex * 5.98, 2.48, 4.9, {
      fontSize: 9.4,
      lineGap: 0.62,
      bulletColor: columnIndex === 0 ? COLORS.teal : COLORS.crimson
    });
  });
  addShapeWithBullets(slide, data.bullets, 0.82, 4.92, 8.05, 1.08);
  addCallout(slide, data.callout, 9.12, 4.92, 3.38, 1.08, "amber");
  addFooter(slide);
}

function renderStability(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: "teal" });
  data.columns.forEach((column, columnIndex) => {
    addCard(slide, {
      x: 0.82 + columnIndex * 4.3,
      y: 2.02,
      w: 3.95,
      h: 2.2,
      title: column.title,
      body: "",
      accent: columnIndex === 0 ? COLORS.crimson : COLORS.teal
    });
    addBulletList(slide, column.items, 1.03 + columnIndex * 4.3, 2.58, 3.3, {
      fontSize: 9.5,
      lineGap: 0.4,
      bulletColor: columnIndex === 0 ? COLORS.crimson : COLORS.teal
    });
  });
  addShapeWithBullets(slide, data.bullets, 8.98, 2.02, 3.5, 2.2);
  addCallout(slide, data.callout, 0.82, 5.0, 11.66, 0.92, "amber");
  addFooter(slide);
}

function renderTools(slide, data, index) {
  addBackground(slide);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.45,
    w: 13.333,
    h: 0.16,
    fill: { color: COLORS.teal }
  });
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway);
  const widths = [3.3, 3.0, 2.8, 3.0, 3.4];
  data.cards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: 0.82 + cardIndex * 0.4,
      y: 2.02 + cardIndex * 0.6,
      w: widths[cardIndex],
      h: 0.86,
      title: card.title,
      body: card.body,
      accent: cardIndex === 2 ? COLORS.teal : COLORS.blue,
      bodySize: 8.2
    });
  });
  addShapeWithBullets(slide, data.bullets, 8.78, 2.18, 3.72, 2.95);
  addFooter(slide);
}

function renderActivity(slide, data, index) {
  addBackground(slide);
  addHeader(slide, data.title, data.subtitle, data.section, index);
  addTakeaway(slide, data.takeaway, { tone: "teal" });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.82,
    y: 1.98,
    w: 6.15,
    h: 4.32,
    rectRadius: 0.05,
    line: { color: COLORS.slateLine, pt: 1 },
    fill: { color: COLORS.white }
  });
  slide.addText("Workshop brief", {
    x: 1.04,
    y: 2.18,
    w: 1.6,
    h: 0.2,
    fontFace: FONT_HEAD,
    fontSize: 12,
    bold: true,
    color: COLORS.text,
    margin: 0
  });
  addBulletList(slide, data.bullets, 1.04, 2.55, 5.45, { fontSize: 10.1, lineGap: 0.62 });
  data.cards.forEach((card, cardIndex) => {
    addCard(slide, {
      x: 7.35,
      y: 2.02 + cardIndex * 1.32,
      w: 5.13,
      h: 1.0,
      title: card.title,
      body: card.body,
      accent: cardIndex === 1 ? COLORS.teal : COLORS.blue,
      bodySize: 8.9
    });
  });
  addCallout(slide, data.callout, 0.82, 6.5, 11.66, 0.72, "amber");
  addFooter(slide);
}

function renderClosing(slide, data) {
  addBackground(slide, "dark");
  slide.addText("KEY TAKEAWAYS", {
    x: 0.82,
    y: 0.58,
    w: 2.0,
    h: 0.18,
    fontFace: FONT_BODY,
    fontSize: 10,
    color: COLORS.blueSoft,
    bold: true,
    charSpace: 1.1,
    margin: 0
  });
  slide.addText(data.title, {
    x: 0.82,
    y: 1.0,
    w: 6.4,
    h: 0.56,
    fontFace: FONT_HEAD,
    fontSize: 24,
    bold: true,
    color: COLORS.white,
    margin: 0
  });
  slide.addText(data.subtitle, {
    x: 0.82,
    y: 1.7,
    w: 6.45,
    h: 0.34,
    fontFace: FONT_BODY,
    fontSize: 11.5,
    color: "D7E7FF",
    margin: 0
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.82,
    y: 2.28,
    w: 5.95,
    h: 0.98,
    rectRadius: 0.05,
    line: { color: COLORS.blueSoft, transparency: 75 },
    fill: { color: COLORS.navy2, transparency: 18 }
  });
  slide.addText(data.takeaway, {
    x: 1.02,
    y: 2.55,
    w: 5.55,
    h: 0.45,
    fontFace: FONT_BODY,
    fontSize: 10.6,
    color: COLORS.white,
    margin: 0
  });
  data.cards.forEach((card, cardIndex) => {
    const row = Math.floor(cardIndex / 3);
    const col = cardIndex % 3;
    addCard(slide, {
      x: 7.15 + col * 1.95,
      y: 1.0 + row * 2.1,
      w: 1.72,
      h: 1.72,
      title: card.title,
      body: card.body,
      accent: cardIndex % 2 === 0 ? COLORS.blue : COLORS.teal,
      dark: true,
      bodySize: 8.3
    });
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.82,
    y: 5.82,
    w: 11.65,
    h: 0.92,
    rectRadius: 0.05,
    line: { color: COLORS.teal, transparency: 65 },
    fill: { color: COLORS.navy2, transparency: 20 }
  });
  slide.addText("Ask this in every automation assessment: Is the process clear, stable, measurable, and supportable?", {
    x: 1.02,
    y: 6.1,
    w: 11.25,
    h: 0.28,
    fontFace: FONT_BODY,
    fontSize: 11,
    color: COLORS.white,
    bold: true,
    align: "center",
    margin: 0
  });
}

function renderSlide(presentation, data, index) {
  const slide = presentation.addSlide();
  slide.addNotes(data.notes);

  switch (data.layout) {
    case "cover":
      renderCover(slide, data);
      break;
    case "cards-left":
      renderCardsLeft(slide, data, index);
      break;
    case "recap-grid":
      renderRecap(slide, data, index);
      break;
    case "runtime-flow":
      renderRuntimeFlow(slide, data, index);
      break;
    case "four-pillars":
      renderFourPillars(slide, data, index);
      break;
    case "mode-slide":
      renderModeSlide(slide, data, index);
      break;
    case "comparison":
      renderComparison(slide, data, index);
      break;
    case "orchestration":
      renderOrchestration(slide, data, index);
      break;
    case "pipeline":
      renderPipeline(slide, data, index);
      break;
    case "workflow-detail":
      renderWorkflowDetail(slide, data, index);
      break;
    case "reframework":
      renderREFramework(slide, data, index);
      break;
    case "timeline":
      renderTimeline(slide, data, index);
      break;
    case "ba-role":
      renderBARole(slide, data, index);
      break;
    case "exceptions":
      renderExceptions(slide, data, index);
      break;
    case "stability":
      renderStability(slide, data, index);
      break;
    case "tools":
      renderTools(slide, data, index);
      break;
    case "activity":
      renderActivity(slide, data, index);
      break;
    case "closing":
      renderClosing(slide, data);
      break;
    default:
      throw new Error(`Unknown slide layout: ${data.layout}`);
  }
}

function slideContentLines(slide) {
  const lines = [];
  if (slide.agenda) {
    lines.push("Workshop focus:");
    slide.agenda.forEach((item) => lines.push(`- ${item}`));
  }
  if (slide.bullets) {
    lines.push("Main bullets:");
    slide.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
  }
  if (slide.flow) {
    lines.push("Flow / process steps:");
    slide.flow.forEach((step, index) => lines.push(`- ${index + 1}. ${step}`));
  }
  if (slide.pillars) {
    lines.push("Model cards:");
    slide.pillars.forEach((pillar) => lines.push(`- ${pillar.title}: ${pillar.body}`));
  }
  if (slide.cards) {
    lines.push("Supporting cards:");
    slide.cards.forEach((card) => lines.push(`- ${card.title}: ${card.body}`));
  }
  if (slide.comparisonRows) {
    lines.push("Comparison table:");
    slide.comparisonRows.forEach((row) => lines.push(`- ${row[0]} | ${row[1]} | ${row[2]}`));
  }
  if (slide.pipelineStages) {
    lines.push("Pipeline stages:");
    slide.pipelineStages.forEach((stage) => lines.push(`- ${stage.title}: ${stage.body}`));
  }
  if (slide.timeline) {
    lines.push("Lifecycle timeline:");
    slide.timeline.forEach((item) => lines.push(`- ${item.title}: ${item.body}`));
  }
  if (slide.exceptionColumns) {
    lines.push("Exception comparison:");
    slide.exceptionColumns.forEach((column) => {
      lines.push(`- ${column.title}:`);
      column.points.forEach((point) => lines.push(`  - ${point}`));
    });
  }
  if (slide.columns) {
    lines.push("Diagnostic columns:");
    slide.columns.forEach((column) => {
      lines.push(`- ${column.title}:`);
      column.items.forEach((item) => lines.push(`  - ${item}`));
    });
  }
  if (slide.callout) {
    lines.push(`Callout: ${slide.callout.title} - ${slide.callout.body}`);
  }
  return lines;
}

function buildOutline() {
  const parts = [
    `# ${deckMeta.title}`,
    "",
    `Audience: ${deckMeta.audience}`,
    `Organization context: ${deckMeta.organization}`,
    `Deck subtitle: ${deckMeta.subtitle}`,
    "",
    "This outline mirrors the generated PowerPoint and includes slide titles, takeaways, on-slide content, visual direction, and speaker notes.",
    ""
  ];

  slides.forEach((slide) => {
    parts.push(`## Slide ${slide.id}: ${slide.title}`);
    parts.push("");
    parts.push("**Subtitle / key takeaway**");
    parts.push(`${slide.subtitle}`);
    parts.push("");
    parts.push("**Primary takeaway sentence**");
    parts.push(`${slide.takeaway}`);
    parts.push("");
    parts.push("**On-slide content**");
    slideContentLines(slide).forEach((line) => parts.push(line));
    parts.push("");
    parts.push("**Visual layout suggestion**");
    parts.push(slide.visual);
    parts.push("");
    parts.push("**Speaker notes**");
    parts.push(slide.notes);
    parts.push("");
  });

  return `${parts.join("\n")}\n`;
}

async function main() {
  await fs.mkdir(exportsDir, { recursive: true });

  const presentation = new pptxgen();
  presentation.layout = "LAYOUT_WIDE";
  presentation.author = "OpenAI Codex";
  presentation.company = "Innobot";
  presentation.subject = "Day 2 RPA workshop";
  presentation.title = deckMeta.title;
  presentation.lang = "en-US";
  presentation.theme = {
    headFontFace: FONT_HEAD,
    bodyFontFace: FONT_BODY,
    lang: "en-US"
  };

  slides.forEach((slide, index) => renderSlide(presentation, slide, index + 1));

  await fs.writeFile(outlinePath, buildOutline(), "utf8");
  await presentation.writeFile({ fileName: pptxPath });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
