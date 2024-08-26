let x = 0;
let y = 0;
export function useMouse () {

  addEventListener('pointermove', (e) => { x = e.pageX; y = e.pageY; });

  const frame = () => {
    requestAnimationFrame(frame);
    document.documentElement.style.setProperty('--m-x', `${x}px`);
    document.documentElement.style.setProperty('--m-y', `${y}px`);
  }
  frame();
}

export function queryMouse () {
  return { x, y };
}
