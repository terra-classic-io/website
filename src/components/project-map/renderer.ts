const drawBubble = (
  context: CanvasRenderingContext2D,
  node: ProjectMapNode,
  visibility: { readonly opacity: number; readonly scale: number },
  theme: RenderTheme,
): void => {
  const isHub = node.categoryId === "terra-hub";
  const markRadius = isHub ? HUB_LOGO_RADIUS : UNIFORM_PROJECT_LOGO_RADIUS;
  const softOutlineRadius = markRadius - 1.5;
  const logoInset = isHub ? 6 : 4;

  context.save();
  context.translate(node.x, node.y);
  context.scale(visibility.scale, visibility.scale);

  if (isHub) {
    drawNodeRing(context, node, markRadius, 3, visibility.opacity, visibility.scale);
  }

  context.globalAlpha = visibility.opacity;
  context.shadowColor = theme.mode === "dark" ? "rgba(15, 23, 42, 0.24)" : "rgba(15, 23, 42, 0.08)";
  context.shadowBlur = 4;
  context.beginPath();
  context.arc(0, 0, softOutlineRadius, 0, Math.PI * 2);
  context.closePath();

  if (node.hasLogo && node.logoImage && node.logoImage.complete && node.logoImage.naturalWidth > 0) {
    context.save();
    context.clip();
    const logoSize = Math.max(18, markRadius * 2 - logoInset);
    context.drawImage(node.logoImage, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
    context.restore();
  } else if (!isHub) {
    drawCategoryIcon(context, node.iconKey, markRadius * 0.72, node.color, visibility.opacity);
  }

  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.beginPath();
  context.arc(0, 0, softOutlineRadius, 0, Math.PI * 2);
  context.lineWidth = isHub ? 2.2 : 1.4;
  context.strokeStyle = theme.mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(15, 23, 42, 0.22)";
  context.stroke();

  if (node.hasInnerDot) {
    drawInnerDot(context, node, markRadius, visibility.opacity);
  }

  context.restore();
};
