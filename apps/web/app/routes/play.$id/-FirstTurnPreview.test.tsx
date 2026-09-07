import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FirstTurnPreview } from './-FirstTurnPreview';

describe('FirstTurnPreview', () => {
  it('starts Day A from actionable cards instead of a global skill picker', () => {
    const html = renderToStaticMarkup(
      <FirstTurnPreview roomId="ABC123" playerName="Minh" seat="A" />
    );

    expect(html.match(/data-card-id=/gu)).toHaveLength(20);
    expect(html).toContain('Minh, bạn đi trước');
    expect(html).toContain('Chọn lá đang phát sáng để dùng kỹ năng');
    expect(html).not.toContain('Chọn kỹ năng, sau đó nhấp source');
    expect(html.match(/<button[^>]*data-card-id="A8"[^>]*>/u)?.[0]).not.toContain('disabled');
    expect(html.match(/<button[^>]*data-card-id="A9"[^>]*>/u)?.[0]).not.toContain('disabled');
    expect(html.match(/<button[^>]*data-card-id="A7"[^>]*>/u)?.[0]).toContain('disabled');
    expect(html).not.toMatch(/<button[^>]*>Đánh dấu báo thù<\/button>/u);
    expect(html).not.toMatch(/<button[^>]*>Thanh tẩy<\/button>/u);
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
