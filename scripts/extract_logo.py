import pymupdf

SRC = "/app/assets/logo.pdf"
OUT = "/app/frontend/public/brand"


def hexc(c):
    return "#%02X%02X%02X" % tuple(int(round(v * 255)) for v in c)


def path_d(items):
    d, cur = [], None
    for it in items:
        op = it[0]
        if op == "l":
            p1, p2 = it[1], it[2]
            if cur != p1:
                d.append(f"M{p1.x:.3f} {p1.y:.3f}")
            d.append(f"L{p2.x:.3f} {p2.y:.3f}")
            cur = p2
        elif op == "c":
            p1, p2, p3, p4 = it[1], it[2], it[3], it[4]
            if cur != p1:
                d.append(f"M{p1.x:.3f} {p1.y:.3f}")
            d.append(f"C{p2.x:.3f} {p2.y:.3f} {p3.x:.3f} {p3.y:.3f} {p4.x:.3f} {p4.y:.3f}")
            cur = p4
        elif op == "re":
            r = it[1]
            d.append(f"M{r.x0:.3f} {r.y0:.3f}H{r.x1:.3f}V{r.y1:.3f}H{r.x0:.3f}Z")
            cur = None
        elif op == "qu":
            q = it[1]
            d.append(f"M{q.ul.x:.3f} {q.ul.y:.3f}L{q.ur.x:.3f} {q.ur.y:.3f}L{q.lr.x:.3f} {q.lr.y:.3f}L{q.ll.x:.3f} {q.ll.y:.3f}Z")
            cur = None
    return " ".join(d) + " Z"


def build(paths, name, pad=2):
    box = paths[0]["rect"]
    for p in paths[1:]:
        box |= p["rect"]
    x, y, w, h = box.x0 - pad, box.y0 - pad, box.width + 2 * pad, box.height + 2 * pad
    body = "".join(
        f'<path fill="{hexc(p["fill"])}" fill-rule="{"evenodd" if p.get("even_odd") else "nonzero"}" d="{path_d(p["items"])}"/>'
        for p in paths
    )
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.2f} {y:.2f} {w:.2f} {h:.2f}" '
           f'width="{w:.0f}" height="{h:.0f}">{body}</svg>')
    with open(f"{OUT}/{name}.svg", "w") as f:
        f.write(svg)
    print(name, f"{w:.0f}x{h:.0f}")


doc = pymupdf.open(SRC)
page = doc[0]
drawings = [d for d in page.get_drawings() if d["rect"].width < 500]  # drop black background rect
top = [d for d in drawings if d["rect"].y1 < 340]
bot = [d for d in drawings if d["rect"].y0 > 340]

build(top, "logo-dark")          # dark text + dark circle w/ yellow octopus (for light bg)
build(bot, "logo-yellow")        # yellow text + yellow circle w/ dark octopus (for dark bg)
build([d for d in top if d["rect"].x1 < 230], "mark-dark")
build([d for d in bot if d["rect"].x1 < 230], "mark-yellow")

# PNG favicon / og from yellow mark
page.set_cropbox(pymupdf.Rect(71.99, 427.9, 211.62, 567.54))
pix = page.get_pixmap(dpi=300, alpha=True)
pix.save(f"{OUT}/mark-yellow-512.png")
print("png", pix.width, pix.height)
