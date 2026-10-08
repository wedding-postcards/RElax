'use strict';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const menuToggle = document.querySelector('.menu-toggle');
const mobileNavigation = document.getElementById('mobile-navigation');
const header = document.querySelector('.site-header');

function setMenu(open, returnFocus = false) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNavigation.hidden = !open;
  if (returnFocus) menuToggle.focus({preventScroll: true});
}
menuToggle.addEventListener('click', () => setMenu(mobileNavigation.hidden));
mobileNavigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNavigation.hidden) setMenu(false, true);
});
document.addEventListener('click', event => {
  if (!mobileNavigation.hidden && !header.contains(event.target)) setMenu(false);
});
matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = new Date().getFullYear(); });

const navLinks = [...document.querySelectorAll('.desktop-nav a')];
const navSections = [...document.querySelectorAll('main>section[id],section#contacts')];
let navigationFrame = 0;
function updateCurrentNavigation() {
  navigationFrame = 0;
  const line = header.offsetHeight + Math.min(180, innerHeight * .2);
  const activeSection = navSections.find(section => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= line && bounds.bottom > line;
  });
  const atBottom = scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
  const activeId = atBottom ? 'contacts' : activeSection?.id;
  navLinks.forEach(link => {
    if (link.hash === `#${activeId}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleNavigationUpdate() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateCurrentNavigation);
}
addEventListener('scroll', scheduleNavigationUpdate, {passive:true});
addEventListener('resize', scheduleNavigationUpdate, {passive:true});
document.fonts.ready.then(scheduleNavigationUpdate);
scheduleNavigationUpdate();

// Prepare the live scene while the visitor reads the hero.
// The original render is only an error/no-script fallback, never a loading poster.
const studio = document.querySelector('.studio');
const mount = document.getElementById('viewer-mount');
const modelHelp = document.getElementById('model-help');
const modelTools = document.querySelector('.model-tools');
const modelLoading = document.getElementById('model-loading');
const studioPoster = document.querySelector('.studio-image');
const sceneLabel = document.getElementById('scene-label');
const presets = [...document.querySelectorAll('[data-model-view]')];
const zoomButtons = [...document.querySelectorAll('[data-model-zoom]')];
let viewer;
let ready = false;
let overviewTarget;
let detailTarget;
let loading = false;
let overviewRadius = 1;
let goalRadius = 1;
let currentView = 'overview';

function zoomLimits() {
  return currentView === 'detail' ? [innerWidth <= 600 ? .30 : .24, .70] : [.68, 1.25];
}
function updateZoomControls() {
  const [min, max] = zoomLimits();
  zoomButtons.forEach(button => {
    button.disabled = button.dataset.modelZoom === 'in'
      ? goalRadius <= overviewRadius * min + .001
      : goalRadius >= overviewRadius * max - .001;
  });
}

function chooseView(name, instant = false) {
  if (!ready) return;
  const detail = name === 'detail';
  currentView = name;
  goalRadius = overviewRadius * (detail ? (innerWidth <= 600 ? .38 : .32) : 1);
  viewer.cameraTarget = detail ? detailTarget : overviewTarget;
  viewer.cameraOrbit = detail ? `-62deg 72deg ${goalRadius}m` : `-32deg 68deg ${goalRadius}m`;
  viewer.fieldOfView = '34deg';
  viewer.resetTurntableRotation();
  if (instant || reducedMotion.matches) requestAnimationFrame(() => viewer.jumpCameraToGoal());
  if (window.AxiomDonor?.setToggle) {
    window.AxiomDonor.setToggle(document.querySelector('[data-axiom-toggle]'), name, instant || reducedMotion.matches);
  } else {
    presets.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.modelView === name)));
  }
  updateZoomControls();
}
function onModelReady() {
  if (ready) return;
  ready = true;
  const center = viewer.getCameraTarget();
  overviewTarget = `${center.x}m ${center.y}m ${center.z}m`;
  // Centre of the three-roller assembly, verified against the source CAD inventory.
  detailTarget = '-0.35m 0.36m 0m';
  overviewRadius = viewer.getCameraOrbit().radius;
  chooseView('overview', true);
  studio.classList.add('has-model');
  mount.inert = false;
  mount.hidden = false;
  modelLoading.hidden = true;
  modelTools.hidden = false;
  modelHelp.hidden = false;
  studioPoster.hidden = true;
}
function onModelError() {
  ready = false;
  studio.classList.remove('has-model');
  mount.inert = true;
  mount.hidden = true;
  modelTools.hidden = true;
  modelHelp.hidden = true;
  modelLoading.hidden = true;
  studioPoster.src = studioPoster.dataset.fallbackSrc;
  studioPoster.hidden = false;
  sceneLabel.textContent = 'Общий вид станка';
}
async function createViewer() {
  if (loading) return;
  loading = true;
  try {
    await import('./vendor/model-viewer.min.js');
    const ModelViewer = customElements.get('model-viewer');
    ModelViewer.dracoDecoderLocation = new URL('vendor/draco/', document.baseURI).href;
    viewer = document.createElement('model-viewer');
    const attributes = {
      alt: '3D-модель бесцентрового релаксационного станка',
      'camera-controls': '', 'disable-pan': '', 'disable-tap': '', 'disable-zoom': '',
      'camera-orbit': '-32deg 68deg 100%',
      'min-camera-orbit': 'auto 42deg 24%', 'max-camera-orbit': 'auto 85deg 125%',
      'field-of-view': '34deg', 'shadow-intensity': '1.2', 'shadow-softness': '.65',
      'environment-image': 'assets/render-derived/studio-1024.hdr', exposure: '.5', 'tone-mapping': 'agx',
      'interaction-prompt': 'none', 'touch-action': 'pan-y', loading: 'eager',
      'aria-describedby': 'model-help', tabindex: '0'
    };
    Object.entries(attributes).forEach(([name, value]) => viewer.setAttribute(name, value));
    // Public model-viewer a11y map: keep its controls and live directions in Russian.
    viewer.a11y = {'interaction-prompt': 'Вращайте модель мышью, касанием или клавишами со стрелками.'};
    for (const [side, label] of Object.entries({front:'спереди',right:'справа',back:'сзади',left:'слева'})) {
      viewer.a11y[side] = `Вид ${label}`;
      viewer.a11y[`upper-${side}`] = `Вид сверху ${label}`;
      viewer.a11y[`lower-${side}`] = `Вид снизу ${label}`;
    }
    viewer.addEventListener('load', onModelReady, {once: true});
    viewer.addEventListener('error', onModelError);
    viewer.addEventListener('progress', event => {
      const progress = Math.max(0, Math.min(1, event.detail.totalProgress));
      modelLoading.querySelector('.loading-track>span').style.transform = `scaleX(${progress})`;
    });
    mount.append(viewer);
    viewer.src = 'machine-web.glb';
  } catch {
    onModelError();
  }
}
// Start while the visitor reads the hero. A photo is reserved for failure,
// never swapped for a differently lit model during normal loading.
createViewer();
presets.forEach(button => button.addEventListener('click', event => chooseView(button.dataset.modelView, event.detail === 0)));
zoomButtons.forEach(button => button.addEventListener('click', event => {
  if (!ready) return;
  const [min, max] = zoomLimits();
  goalRadius = Math.max(overviewRadius * min, Math.min(overviewRadius * max,
    goalRadius * (button.dataset.modelZoom === 'in' ? .86 : 1 / .86)));
  const orbit = viewer.getCameraOrbit();
  viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${goalRadius}m`;
  if (event.detail === 0 || reducedMotion.matches) viewer.jumpCameraToGoal();
  updateZoomControls();
}));
