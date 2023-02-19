"use strict";
const $ = document.querySelector.bind(document);
const $A = document.querySelectorAll.bind(document);
const params = [
  "flagdimension",
  "flagbandcolor1",
  "flagbandcolor2",
  "flagbandcolor3",
  "flagbandangle",
  "flagcolor",
  "flagrayangle",
  "flagraynumbers",
];
let globalZoomNeeded;
let globalAutoZoom = false;

const KurdistanFlag = {
  spinUpdate(event) {
    const eC = event.currentTarget;
    const isInc = eC.classList.contains("increment");
    const dataId = eC.getAttribute("data-id");
    const input = $(`#${dataId}`);
    let v = Number(input.value);
    input.value = isInc ? ++v : --v;
    if (input.id === "flagzoom") {
      KurdistanFlag.zoom(input.value);
    } else {
      KurdistanFlag.requestNewFlag({
        type: "submit",
        bySpinner: true,
        dataId: dataId,
      });
    }
  },
  download() {
    const a = document.createElement("a");
    a.setAttribute("download", "KurdistanFlag.png");
    $("#flag").toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      a.setAttribute("href", url);
      a.click();
    });
  },
  createURL() {
    let url = window.location.origin + "?";
    params.forEach((param, index, array) => {
      const val = document.querySelector("#" + param).value;
      url +=
        param +
        "=" +
        encodeURIComponent(val) +
        (index !== array.length - 1 ? "&" : "");
    });
    return url;
  },
  zoom(value) {
    globalZoomNeeded = true;
    const flag = $("#flag");
    flag.style.transform = `scale(${value / 100})`;
    flag.style.transformOrigin = `top center`;
  },
  addQuickHelpListeners() {
    $A(".quickhelp").forEach((node) => {
      node.addEventListener("click", (e) => {
        const dI = e.currentTarget.getAttribute("data-id");
        $(`[data-id='${dI}']`).click();
      });
    });
  },
  handleSetForm(event) {
    event.preventDefault();
    KurdistanFlag.requestNewFlag(event);
  },
  handleZoomForm(event) {
    event.preventDefault();
    KurdistanFlag.zoom($("#flagzoom").value);
  },
  copyLink(event) {
    const link = $("#shareflaglink").getAttribute("href");
    let clipboard = navigator.clipboard;
    if (clipboard == undefined) {
      console.warn("Clipboard is only available on https and localhost");
    } else {
      navigator.clipboard.writeText(link);
      $("#copylinkspan").textContent = "COPIED!";
    }
  },
  handleIconClick(event) {
    const dataId = event.currentTarget.getAttribute("data-id");
    const sPanel = $("#secondary-settings-panel");
    const flagC = $("#flagcontainer");
    sPanel.setAttribute("data-active-id", dataId);
    sPanel.classList.remove("hidden");
    if (dataId === "flagshare") {
      const canvas = $("#flag");
      $("#shareflag").src = canvas.toDataURL("image/jpeg", 1.0);
      const url = KurdistanFlag.createURL();
      $("#shareflaglink").setAttribute("href", url);
      $(".twitter-share-button").setAttribute(
        "href",
        "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(
            "I just designed a Kurdistan flag by Kurdistan Flag Creator. Check it out! "
          ) +
          url
      );
    }
    if (dataId === "flagshare" || dataId === "flaghelp") {
      flagC.style.display = "none";
      sPanel.classList.add("panel");
    } else {
      flagC.style.display = "flex";
      sPanel.classList.remove("panel");
    }
    $A(".icon").forEach((node) => {
      node.classList.remove("active");
    });
    event.currentTarget.classList.add("active");
    $A("#secondary-settings-panel .rows").forEach((node) => {
      node.classList.add("hidden");
    });
    let n = $("#secondary-settings-panel #" + dataId);
    while (!n.parentNode.classList.contains("rows")) {
      n = n.parentNode;
    }
    n.parentNode.classList.remove("hidden");
    if (
      dataId === "flagshare" ||
      dataId === "flaghelp" ||
      dataId === "flagdownload"
    ) {
      KurdistanFlag.showZoomUI(false);
      $("#closecontainer").style.display = "none";
    } else {
      if (
        globalZoomNeeded ||
        KurdistanFlag.needsZoom($("#flagdimension").value)
      ) {
        KurdistanFlag.showZoomUI(true);
      } else {
        KurdistanFlag.showZoomUI(false);
      }
      $("#closecontainer").style.display = "flex";
    }
  },
  addListeners() {
    const form = $("#flag-settings-form");
    form.addEventListener("input", this.handleSetForm);
    form.addEventListener("submit", this.handleSetForm);
    const zoomform = $("#zoom-form");
    zoomform.addEventListener("input", this.handleZoomForm);
    zoomform.addEventListener("submit", this.handleZoomForm);
    $("#flagdownload").addEventListener("click", KurdistanFlag.download);
    $A(".spinner.increment").forEach((node) => {
      node.addEventListener("click", KurdistanFlag.spinUpdate);
    });
    $A(".spinner.decrement").forEach((node) => {
      node.addEventListener("click", KurdistanFlag.spinUpdate);
    });
    $("#sharebutton").addEventListener("click", this.copyLink);
    $A(".icon").forEach((node) => {
      node.addEventListener("click", KurdistanFlag.handleIconClick);
    });
    KurdistanFlag.addQuickHelpListeners();
    $("#closecontainer").addEventListener("click", (event) => {
      event.currentTarget.parentNode.classList.add("hidden");
    });
    KurdistanFlag.addH1Animation();
  },
  init() {
    const urlParams = new URLSearchParams(window.location.search);
    if (
      params.every((param) => {
        return urlParams.has(param);
      })
    ) {
      params.forEach((param) => {
        const v = urlParams.get(param);
        $("#" + param).value = v;
        if (param === "flagdimension") {
          $("#flagwidth").value = parseFloat(v) * 1.5;
        }
      });
      KurdistanFlag.checkGlobalZoomNeeded(urlParams.get("flagdimension"));
      KurdistanFlag.requestNewFlag();
    } else {
      const flag = $("#flag");
      const p = (arg) => {
        return window.getComputedStyle(flag).getPropertyValue(arg);
      };
      const width = p("width");
      const height = p("height");
      $("#flagwidth").value = parseFloat(width);
      $("#flagdimension").value = parseFloat(height);
      KurdistanFlag.checkGlobalZoomNeeded(parseFloat(height));
      globalAutoZoom = false;
      KurdistanFlag.requestNewFlag();
    }
  },
  addH1Animation() {
    const sheet = $("#flag-css").sheet;
    const wPx = window
      .getComputedStyle($("#main-heading"))
      .getPropertyValue("width");
    sheet.insertRule(
      `
        @keyframes gradient {
          from {background-position: 0px 0px;}
            to {background-position: ${wPx} 0px;}
        }
      `,
      sheet.cssRules.length
    );
    sheet.insertRule(
      `
      h1{
          background-size: ${wPx} 100%;
          animation: gradient 5s linear infinite;
      }
      `,
      sheet.cssRules.length
    );
  },
  checkGlobalZoomNeeded(flagdimension) {
    if (globalZoomNeeded === undefined) {
      globalZoomNeeded = KurdistanFlag.needsZoom(flagdimension);
      globalAutoZoom = globalZoomNeeded;
    }
  },
  showZoomUI(bool) {
    $("#zoomcontainer").classList[bool ? "remove" : "add"]("zoomhidden");
  },
  adjustZoom(flagdimension) {
    const flagW = flagdimension * 1.5;
    const flagCon = $("#flagcontainer");
    const flag = $("#flag");
    const zoomHeightRatio = flagdimension / flagCon.clientHeight;
    const zoomWidthRatio = flagW / flagCon.clientWidth;
    const cssHeightRatio = 1 / zoomHeightRatio;
    const cssWidthRatio = 1 / zoomWidthRatio;
    let zoomPercentage;
    if (flagdimension > flagCon.clientHeight || flagW > flagCon.clientWidth) {
      flag.style.transform = `scale(${
        cssHeightRatio < cssWidthRatio ? cssHeightRatio : cssWidthRatio
      })`;
      flag.style.transformOrigin = `top center`;
      zoomPercentage =
        cssHeightRatio < cssWidthRatio
          ? cssHeightRatio * 100
          : cssWidthRatio * 100;
    } else {
      flag.style.transform = "";
      flag.style.transformOrigin = "";
      zoomPercentage = 100;
    }
    $("#flagzoom").value = zoomPercentage;
  },
  needsZoom(flagdimension) {
    const flagW = flagdimension * 1.5;
    const flagCon = $("#flagcontainer");
    return flagdimension > flagCon.clientHeight || flagW > flagCon.clientWidth;
  },
  requestNewFlag(event) {
    const form = $("#flag-settings-form");
    if (event) {
      if (event.type === "input") {
        if (event.target.id === "flagwidth") {
          $("#flagdimension").value = parseFloat(form.flagwidth.value) / 1.5;
        }
        if (event.target.id === "flagdimension") {
          $("#flagwidth").value = parseFloat(form.flagdimension.value) * 1.5;
        }
      }
      if (event.type === "submit") {
        const dataId = event.bySpinner
          ? event.dataId
          : event.submitter.getAttribute("data-id");
        if (dataId === "flagwidth") {
          $("#flagdimension").value = parseFloat(form.flagwidth.value) / 1.5;
        }
        if (dataId === "flagdimension") {
          $("#flagwidth").value = parseFloat(form.flagdimension.value) * 1.5;
        }
      }
    }
    const flagwidth = parseFloat(form.flagwidth.value);
    const flagdimension = parseFloat(form.flagdimension.value);
    const flagbandcolor1 = form.flagbandcolor1.value;
    const flagbandcolor2 = form.flagbandcolor2.value;
    const flagbandcolor3 = form.flagbandcolor3.value;
    const flagbandangle = parseFloat(form.flagbandangle.value);
    const flagcolor = form.flagcolor.value;
    const flagrayangle = parseFloat(form.flagrayangle.value);
    const flagraynumbers = parseFloat(form.flagraynumbers.value);
    KurdistanFlag.draw(
      flagdimension,
      flagbandcolor1,
      flagbandcolor2,
      flagbandcolor3,
      flagbandangle,
      flagcolor,
      flagrayangle,
      flagraynumbers
    );
    if (globalZoomNeeded || KurdistanFlag.needsZoom(flagdimension)) {
      KurdistanFlag.showZoomUI(true);
    } else {
      KurdistanFlag.showZoomUI(false);
    }
    if (globalAutoZoom) {
      KurdistanFlag.adjustZoom(flagdimension);
      globalAutoZoom = false;
    }
  },
  getResizeRatio(rotationAngle, flagWidth, flagHeight) {
    const hypot = Math.hypot(flagWidth, flagHeight);
    const smallAngle = (Math.atan(flagHeight / flagWidth) * 180) / Math.PI;
    const bigAngle = (Math.atan(flagWidth / flagHeight) * 180) / Math.PI;
    let remnantAngle, resizedHeight;
    if (rotationAngle <= 90 || (rotationAngle > 180 && rotationAngle <= 270)) {
      rotationAngle === 90 || rotationAngle === 270
        ? (rotationAngle = 90)
        : (rotationAngle %= 90);
      remnantAngle = bigAngle - rotationAngle;
      resizedHeight = hypot * Math.cos(remnantAngle * (Math.PI / 180));
    } else if (
      (rotationAngle > 90 && rotationAngle <= 180) ||
      (rotationAngle > 270 && rotationAngle <= 360)
    ) {
      rotationAngle === 180 || rotationAngle === 360
        ? (rotationAngle = 90)
        : (rotationAngle %= 90);
      remnantAngle = bigAngle + rotationAngle;
      resizedHeight = hypot * Math.sin(remnantAngle * (Math.PI / 180));
    }
    const resizeRatio = resizedHeight / flagHeight;
    return resizeRatio;
  },
  findCanvasCordinates(
    angle,
    resizeRatio,
    originalFlagWidth,
    originalFlagHeight
  ) {
    const flagWidth = originalFlagWidth * resizeRatio;
    const flagHeight = originalFlagHeight * resizeRatio;
    const xOffset = originalFlagWidth / 2;
    const yOffset = originalFlagHeight / 2;
    const hypot = Math.hypot(flagWidth, flagHeight);
    const smallAngle = (Math.atan(flagHeight / flagWidth) * 180) / Math.PI;
    const bigAngle = (Math.atan(flagWidth / flagHeight) * 180) / Math.PI;
    const rotationAngle = 270 + smallAngle + angle;
    const x =
      Math.hypot(flagWidth / 2, flagHeight / 2) *
      Math.sin(rotationAngle * (Math.PI / 180));
    const y =
      Math.hypot(flagWidth / 2, flagHeight / 2) *
      Math.cos(rotationAngle * (Math.PI / 180));
    const absX = x + xOffset;
    const absY = yOffset - y;
    return [absX, absY];
  },
  draw(
    flagdimension,
    flagbandcolor1,
    flagbandcolor2,
    flagbandcolor3,
    flagbandangle,
    flagcolor,
    flagrayangle,
    flagraynumbers
  ) {
    const canvas = $("#flag");
    canvas.height = flagdimension;
    canvas.width = flagdimension * 1.5;
    canvas.style.height = flagdimension + "px";
    canvas.style.width = flagdimension * 1.5 + "px";
    canvas.style.maxWidth = "unset";
    canvas.style.maxHeight = "unset";
    let flagHeight = flagdimension;
    let flagWidth = flagHeight * 1.5;
    let radius = flagHeight / 4;
    let rayNumbers = flagraynumbers;
    let pointsArray = {};
    let connectArray = {};
    let rayCSS = ``;
    let unit = `%`;
    let xOffset = flagWidth / 3;
    let yOffset = flagHeight / 4;
    let rayAngleDifference = flagrayangle / 2;
    let medianAngle = 360 / rayNumbers / 2;
    let smallerSide = radius * Math.sin(medianAngle * (Math.PI / 180));
    let biggerSide = radius * Math.cos(medianAngle * (Math.PI / 180));
    let innerRadius =
      biggerSide -
      (1 / Math.tan((medianAngle + rayAngleDifference) * (Math.PI / 180))) *
        smallerSide;
    if (canvas.getContext) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let r = this.getResizeRatio(flagbandangle, flagWidth, flagHeight);
      let c = this.findCanvasCordinates(
        flagbandangle,
        r,
        flagWidth,
        flagHeight
      );
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate((flagbandangle * Math.PI) / 180);
      ctx.fillStyle = flagbandcolor1;
      ctx.fillRect(0, 0, flagWidth * r, (flagHeight * r) / 3);
      ctx.fillStyle = flagbandcolor2;
      ctx.fillRect(
        0,
        ((flagHeight * r) / 3) * 1,
        flagWidth * r,
        (flagHeight * r) / 3
      );
      ctx.fillStyle = flagbandcolor3;
      ctx.fillRect(
        0,
        ((flagHeight * r) / 3) * 2,
        flagWidth * r,
        (flagHeight * r) / 3
      );
      ctx.restore();
      for (let i = 0; i < rayNumbers; i++) {
        let x = radius + Math.sin((2 * Math.PI * i) / rayNumbers) * radius;
        let y = radius - Math.cos((2 * Math.PI * i) / rayNumbers) * radius;
        pointsArray[i] = [x + xOffset, y + yOffset];
      }
      for (let i = 0; i < rayNumbers * 2; i++) {
        if (i % 2 == 0) continue;
        let x =
          radius + Math.sin((2 * Math.PI * i) / (rayNumbers * 2)) * innerRadius;
        let y =
          radius - Math.cos((2 * Math.PI * i) / (rayNumbers * 2)) * innerRadius;
        connectArray[parseInt(i / 2) + 1] = [x + xOffset, y + yOffset];
      }
      let poly = [];
      for (let i = 0; i < rayNumbers; i++) {
        poly.push(pointsArray[i][0]);
        poly.push(pointsArray[i][1]);
        poly.push(connectArray[i + 1][0]);
        poly.push(connectArray[i + 1][1]);
      }
      ctx.fillStyle = flagcolor;
      ctx.beginPath();
      ctx.moveTo(poly[0], poly[1]);
      for (let item = 2; item < poly.length - 1; item += 2) {
        ctx.lineTo(poly[item], poly[item + 1]);
      }
      ctx.closePath();
      ctx.fill();
    }
  },
};

window.addEventListener("DOMContentLoaded", (event) => {
  KurdistanFlag.addListeners();
  KurdistanFlag.init();
});
