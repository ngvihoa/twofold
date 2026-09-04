import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FirstTurnPreview } from './-FirstTurnPreview';

describe('FirstTurnPreview', () => {
  it('renders the guided Day A board with impossible opening skills disabled', () => {
    const html = renderToStaticMarkup(
      <FirstTurnPreview roomId="ABC123" playerName="Minh" seat="A" />
    );

    expect(html.match(/data-card-id=/gu)).toHaveLength(20);
    expect(html).toContain('Minh, bạn đi trước');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Xạ thủ bắn<\/button>/u);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Hồi sinh<\/button>/u);
    expect(html).toContain('Đánh dấu báo thù');
    expect(html).toContain('Thanh tẩy');
    expect(html).toContain('aria-label="B1 · Vai trò ẩn"');
    expect(html).not.toContain('aria-label="B1 · Ma sói"');
  });

  it('renders an observation notice for player B', () => {
    const html = renderToStaticMarkup(
      <FirstTurnPreview roomId="ABC123" playerName="Lan" seat="B" />
    );

    expect(html).toContain('Người chơi A đi trước');
    expect(html).toContain('Khu hành động sẽ mở khi đến lượt của bạn.');
  });
});
