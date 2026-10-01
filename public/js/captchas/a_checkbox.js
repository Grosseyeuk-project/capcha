export default {
  id: 'a_checkbox', tier: 1, title: 'Case à cocher', time: 15000,
  mount(host, api) {
    const box = api.h('button', { class: 'plain-check', onclick: () => api.solve() }, 'Je ne suis pas un robot');
    host.append(box);
    return { destroy() {} };
  }
};
