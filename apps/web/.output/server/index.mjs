globalThis.__nitro_main__ = import.meta.url;
import { c as NodeRequest, i as defineLazyEventHandler, l as NodeResponse, n as HTTPError, o as toEventHandler, r as defineHandler, s as toRequest, t as H3Core, u as serve } from "./_libs/h3+rou3+srvx.mjs";
import { t as nodeAdapter } from "./_libs/crossws.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region ../../node_modules/.pnpm/nitro@3.0.260610-beta_@vercel+blob@2.8.0_chokidar@5.0.0_jiti@1.21.7_lru-cache@11.5.2_ro_f4e3573268e3f17912300a26d03707fa/node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/assets/app-BeoDL_1q.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"86b4-yaPz9XaJBa62qC2klnm3Yx9PQlI\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 34484,
		"path": "../public/assets/app-BeoDL_1q.css"
	},
	"/assets/preload-helper-C3b6u_a-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6aac-Sz/oLV5TO2+HnGwYmkTbOiS+p2M\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 27308,
		"path": "../public/assets/preload-helper-C3b6u_a-.js"
	},
	"/assets/rolldown-runtime-CbXtAM7H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24d-+aXgvbJ1Wwcp2A8AXKIBByksYC8\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 589,
		"path": "../public/assets/rolldown-runtime-CbXtAM7H.js"
	},
	"/assets/room._id-Z3qjSEqz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1694-3R2shBVHY9KcBtV3/d5MxNaL0ls\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 5780,
		"path": "../public/assets/room._id-Z3qjSEqz.js"
	},
	"/assets/index-CUYJQcJQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4463e-Pxl2opxLK3FPUjpPrISM+yXN0Do\"",
		"mtime": "2026-09-01T11:03:45.281Z",
		"size": 280126,
		"path": "../public/assets/index-CUYJQcJQ.js"
	},
	"/assets/routes-CLAj-6rp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1bda-sRzH1S+gFA5QQtTsoHOdBBOfcmc\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 7130,
		"path": "../public/assets/routes-CLAj-6rp.js"
	},
	"/assets/route-CZEvCuXK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1817a-TdhgknOlrpwx0Ox+wuw4I+0OJts\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 98682,
		"path": "../public/assets/route-CZEvCuXK.js"
	},
	"/assets/sparkles-EaGKmJuY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"564-/vf3fHo2T5KJVpxvvD5KCT6CvJ0\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 1380,
		"path": "../public/assets/sparkles-EaGKmJuY.js"
	},
	"/assets/swords-BziO8Bp6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"21e-wUbzO7BPfZeGjSr+6VvUhmqDebc\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 542,
		"path": "../public/assets/swords-BziO8Bp6.js"
	},
	"/assets/src-CnW-1DQ8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc24-6qZRUOEdfsu8x6Es4e2lYuP+S2Y\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 64548,
		"path": "../public/assets/src-CnW-1DQ8.js"
	},
	"/assets/useNavigate-CXqOci-H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1fa4-Syu8U+LAMiivPO22bwW6SbFh7zw\"",
		"mtime": "2026-09-01T11:03:45.282Z",
		"size": 8100,
		"path": "../public/assets/useNavigate-CXqOci-H.js"
	},
	"/characters/ba-gia-kho-tinh.png": {
		"type": "image/png",
		"etag": "\"1ff0-v9juxJXJa7F8CBJLyx9CwRGKmiI\"",
		"mtime": "2026-09-01T11:03:45.602Z",
		"size": 8176,
		"path": "../public/characters/ba-gia-kho-tinh.png"
	},
	"/characters/bac-si.webp": {
		"type": "image/webp",
		"etag": "\"49c2-mEY/s8HnDGnnlQ5GGQJeEoFl6fY\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 18882,
		"path": "../public/characters/bac-si.webp"
	},
	"/characters/ban-soi.png": {
		"type": "image/png",
		"etag": "\"2518-cLv+69iJ/27wbYSsv+XIiTS+ZvU\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 9496,
		"path": "../public/characters/ban-soi.png"
	},
	"/characters/bao-ve.png": {
		"type": "image/png",
		"etag": "\"2812-jlvyp0cvo5P5ivHnbvrKL9kFzy0\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 10258,
		"path": "../public/characters/bao-ve.png"
	},
	"/characters/canh-sat-truong.png": {
		"type": "image/png",
		"etag": "\"3470-DXZBx2HI1zsBT8jempZhq1RVOe8\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 13424,
		"path": "../public/characters/canh-sat-truong.png"
	},
	"/characters/cau-be-mieng-bu.png": {
		"type": "image/png",
		"etag": "\"62dc-/2tbfeo80M/uuK6LAZtp8b3OzK8\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 25308,
		"path": "../public/characters/cau-be-mieng-bu.png"
	},
	"/characters/con-bac.png": {
		"type": "image/png",
		"etag": "\"5a20-WTfv7BWibjNze1X98cyISp0S6Ec\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 23072,
		"path": "../public/characters/con-bac.png"
	},
	"/characters/con-do.webp": {
		"type": "image/webp",
		"etag": "\"1f1c-Mrl4ZmfBzZuHa1vFqglPRphBW2w\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 7964,
		"path": "../public/characters/con-do.webp"
	},
	"/characters/cupid.jpeg": {
		"type": "image/jpeg",
		"etag": "\"b74-VEbSep1ZRZs9yhkcHoHiygBaqdo\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 2932,
		"path": "../public/characters/cupid.jpeg"
	},
	"/characters/dan-lang.png": {
		"type": "image/png",
		"etag": "\"4124-X9sWAsZduPXOVQ6vQnyCwGTzquY\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 16676,
		"path": "../public/characters/dan-lang.png"
	},
	"/characters/do-te.png": {
		"type": "image/png",
		"etag": "\"1184-yfwe6wC7wZ/VN8NbH0Dwdlhvw/Y\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 4484,
		"path": "../public/characters/do-te.png"
	},
	"/characters/giam-nguc.png": {
		"type": "image/png",
		"etag": "\"2bb2-xrifvOkL4eATl6zaF5xOuVFip1M\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 11186,
		"path": "../public/characters/giam-nguc.png"
	},
	"/characters/giao-chu.png": {
		"type": "image/png",
		"etag": "\"2ed6-12JnINUcRJ4ardChJ4P0NZwACoo\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 11990,
		"path": "../public/characters/giao-chu.png"
	},
	"/characters/ke-an-thit-nguoi.png": {
		"type": "image/png",
		"etag": "\"3376-P+MBh/4lHUJmCC/4L1rRBKrFPSY\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 13174,
		"path": "../public/characters/ke-an-thit-nguoi.png"
	},
	"/characters/ke-bao-thu.png": {
		"type": "image/png",
		"etag": "\"2bf0-/2tvFGGrdaYkjiIjEGomye+hSAY\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 11248,
		"path": "../public/characters/ke-bao-thu.png"
	},
	"/characters/ke-dat-bom.png": {
		"type": "image/png",
		"etag": "\"209e-akQKAgZBzN1Li5CScgTlWux3roA\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 8350,
		"path": "../public/characters/ke-dat-bom.png"
	},
	"/characters/ke-dong-pham.png": {
		"type": "image/png",
		"etag": "\"2426-hZXZ9Vd6v0xMUnGB1lDZ7MOkd5s\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 9254,
		"path": "../public/characters/ke-dong-pham.png"
	},
	"/characters/ke-phong-hoa.png": {
		"type": "image/png",
		"etag": "\"1a28-mHmVMwEmwjBx2EX2vRDa/NT2BSw\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 6696,
		"path": "../public/characters/ke-phong-hoa.png"
	},
	"/characters/ke-ham-mo-ma-soi.png": {
		"type": "image/png",
		"etag": "\"652a-JkIFtBmv2I7G6XXm7OJqBK1uxrs\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 25898,
		"path": "../public/characters/ke-ham-mo-ma-soi.png"
	},
	"/characters/ke-trom-mo.png": {
		"type": "image/png",
		"etag": "\"1bde-4/ANjOezthLDUtI0IYu8EymPyhA\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 7134,
		"path": "../public/characters/ke-trom-mo.png"
	},
	"/characters/ke-vo-danh.png": {
		"type": "image/png",
		"etag": "\"119a-MYxAKb1wuzZ3zXpL0co9mmuKzoM\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 4506,
		"path": "../public/characters/ke-vo-danh.png"
	},
	"/characters/ke-xui-giuc.webp": {
		"type": "image/webp",
		"etag": "\"5a5a-sO9j4W5y5xdUuQgVg9HX5L0oUMw\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 23130,
		"path": "../public/characters/ke-xui-giuc.webp"
	},
	"/characters/ky-nu.png": {
		"type": "image/png",
		"etag": "\"1ea2-2Ac6rLtwDvCJlTJojPY6nSHj7h8\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 7842,
		"path": "../public/characters/ky-nu.png"
	},
	"/characters/luc-si.png": {
		"type": "image/png",
		"etag": "\"33a6-9kTEAtpxxSXX1in38Yljz6CAWBw\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 13222,
		"path": "../public/characters/luc-si.png"
	},
	"/characters/ma-nu.png": {
		"type": "image/png",
		"etag": "\"2cb6-X3Y1RIz8xdAj9HhRYbxkIGARK6Q\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 11446,
		"path": "../public/characters/ma-nu.png"
	},
	"/characters/ma-soi-thuong.png": {
		"type": "image/png",
		"etag": "\"38b4-KhuL0ePp1Ag+G9c64Aj9EApnyFU\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 14516,
		"path": "../public/characters/ma-soi-thuong.png"
	},
	"/characters/muc-su.png": {
		"type": "image/png",
		"etag": "\"4694-hlzQjgt4AxKuZXCGNgD4BVSmdqM\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 18068,
		"path": "../public/characters/muc-su.png"
	},
	"/characters/nghe-si-vi-cam.png": {
		"type": "image/png",
		"etag": "\"551a-70gWQVM0uaMxBJflWdq9n6lctuo\"",
		"mtime": "2026-09-01T11:03:45.603Z",
		"size": 21786,
		"path": "../public/characters/nghe-si-vi-cam.png"
	},
	"/characters/nguoi-gac-dem.png": {
		"type": "image/png",
		"etag": "\"2d44-ZlzB80xge4JdGz2zKb2zS0DoWQ4\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 11588,
		"path": "../public/characters/nguoi-gac-dem.png"
	},
	"/characters/nguoi-dat-bay.png": {
		"type": "image/png",
		"etag": "\"4cfc-BRzwzyDrhImKuUwiQ8dXS+qCwxk\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 19708,
		"path": "../public/characters/nguoi-dat-bay.png"
	},
	"/characters/nguoi-gan-co.png": {
		"type": "image/png",
		"etag": "\"39ee-6QAcLDKBx8Fx9rn5z1Q4eQGGh7A\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 14830,
		"path": "../public/characters/nguoi-gan-co.png"
	},
	"/characters/nguoi-goi-hon.png": {
		"type": "image/png",
		"etag": "\"3366-9wO7PgWahq2OoqpbpZbMWe5MjsQ\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 13158,
		"path": "../public/characters/nguoi-goi-hon.png"
	},
	"/characters/nguoi-thuyet-giao.png": {
		"type": "image/png",
		"etag": "\"400a-uQmbiHOkDO4LVVwIpsWNyVd1CPE\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 16394,
		"path": "../public/characters/nguoi-thuyet-giao.png"
	},
	"/characters/nguoi-khai-menh.webp": {
		"type": "image/webp",
		"etag": "\"76ae-nlFtMxK/4xFYW0yFNO154053JJU\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 30382,
		"path": "../public/characters/nguoi-khai-menh.webp"
	},
	"/characters/nguoi-rung-chuong.png": {
		"type": "image/png",
		"etag": "\"2eb8-XzjvVrxll2PxdlViIha1g7D1ass\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 11960,
		"path": "../public/characters/nguoi-rung-chuong.png"
	},
	"/characters/nguoi-yeu-hoa-binh.png": {
		"type": "image/png",
		"etag": "\"3310-SfK25D75CRRisiozfmBQfhovFrk\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 13072,
		"path": "../public/characters/nguoi-yeu-hoa-binh.png"
	},
	"/characters/nha-gia-kim.webp": {
		"type": "image/webp",
		"etag": "\"13e6-ccG/8BO+Ey+BVMY1Tk8sK5dPXNQ\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 5094,
		"path": "../public/characters/nha-gia-kim.webp"
	},
	"/characters/nha-ngoai-cam.png": {
		"type": "image/png",
		"etag": "\"457c-RftyHaMG0PuYLEnNZXDxfkxHBg0\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 17788,
		"path": "../public/characters/nha-ngoai-cam.png"
	},
	"/characters/nha-phan-tich.png": {
		"type": "image/png",
		"etag": "\"70e6-klfP7zBwvfHoil5lhzND7GtmxEY\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 28902,
		"path": "../public/characters/nha-phan-tich.png"
	},
	"/characters/nha-thien-van-hoc.png": {
		"type": "image/png",
		"etag": "\"35c2-VTJPibMXQO7DFUu0klf2E44PovQ\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 13762,
		"path": "../public/characters/nha-thien-van-hoc.png"
	},
	"/characters/nhan-ngu.webp": {
		"type": "image/webp",
		"etag": "\"c5c-Q0a+dsfHXS2ONxoR+/V+pzPNcyo\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 3164,
		"path": "../public/characters/nhan-ngu.webp"
	},
	"/characters/ong-gia-noel.png": {
		"type": "image/png",
		"etag": "\"222c-81ijWiJ0+jFEsSR/R2k6oWWphJY\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 8748,
		"path": "../public/characters/ong-gia-noel.png"
	},
	"/characters/phap-y.png": {
		"type": "image/png",
		"etag": "\"2482-Ubg7n5uAATDEWBV53JAz+gzd2oY\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 9346,
		"path": "../public/characters/phap-y.png"
	},
	"/characters/phu-thuy.webp": {
		"type": "image/webp",
		"etag": "\"4520-RguSg0Nb8thqr21DitayGwEGSS0\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 17696,
		"path": "../public/characters/phu-thuy.webp"
	},
	"/characters/quan-nguc.webp": {
		"type": "image/webp",
		"etag": "\"4576-AQnIEJ30G2CRgEKwxU8oeilBoH4\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 17782,
		"path": "../public/characters/quan-nguc.webp"
	},
	"/characters/sat-nhan-hang-loat.png": {
		"type": "image/png",
		"etag": "\"29c2-3mEoNDA8m67Ov25lxSCTm9ISg3M\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 10690,
		"path": "../public/characters/sat-nhan-hang-loat.png"
	},
	"/characters/sat-thu.webp": {
		"type": "image/webp",
		"etag": "\"275c-x2doDi9f/kFr+1nOqBvUdd/o+OI\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 10076,
		"path": "../public/characters/sat-thu.webp"
	},
	"/characters/soi-ac-mong.png": {
		"type": "image/png",
		"etag": "\"1f4c-Hl3zInt5QffCUUzxTHvudUsDmKk\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 8012,
		"path": "../public/characters/soi-ac-mong.png"
	},
	"/characters/soi-bao-to.png": {
		"type": "image/png",
		"etag": "\"1856-dtkWfBzNvoibcFG5rP0p73OfUDw\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 6230,
		"path": "../public/characters/soi-bao-to.png"
	},
	"/characters/soi-bien-kich.webp": {
		"type": "image/webp",
		"etag": "\"3d2e-SVzw4z01JZJsggdV+Z3pHa6j6tQ\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 15662,
		"path": "../public/characters/soi-bien-kich.webp"
	},
	"/characters/soi-buong-binh.png": {
		"type": "image/png",
		"etag": "\"2694-4MdmZ5KDUfITiKiRbPMcGfPjHec\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 9876,
		"path": "../public/characters/soi-buong-binh.png"
	},
	"/characters/soi-chieu-hon.webp": {
		"type": "image/webp",
		"etag": "\"3146-li/mpi6HW8+7DCpl0Fb8KMbs+VU\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 12614,
		"path": "../public/characters/soi-chieu-hon.webp"
	},
	"/characters/soi-dien-cuong.webp": {
		"type": "image/webp",
		"etag": "\"208-9tSEezER3/Z14gZLtjfZkqkL5qc\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 520,
		"path": "../public/characters/soi-dien-cuong.webp"
	},
	"/characters/soi-dau-dan.png": {
		"type": "image/png",
		"etag": "\"33de-n5hHOceLpWEixZJa21lG7HSpceY\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 13278,
		"path": "../public/characters/soi-dau-dan.png"
	},
	"/characters/soi-hac-am.webp": {
		"type": "image/webp",
		"etag": "\"2b70-dfoKOzfb5z+5rWxiL5qqLw9H+JQ\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 11120,
		"path": "../public/characters/soi-hac-am.webp"
	},
	"/characters/soi-doc-to.webp": {
		"type": "image/webp",
		"etag": "\"453c-QWI6DGwnT8AeRLtcX1AULOR1AfQ\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 17724,
		"path": "../public/characters/soi-doc-to.webp"
	},
	"/characters/soi-ho-ve.webp": {
		"type": "image/webp",
		"etag": "\"256c-Y0ZS0j/8JSmlhzfTkZhkadkCeaM\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 9580,
		"path": "../public/characters/soi-ho-ve.webp"
	},
	"/characters/soi-lua-dao.webp": {
		"type": "image/webp",
		"etag": "\"10a6-7w1YSbrQDb16qhwDcMAZ0E7EKTU\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 4262,
		"path": "../public/characters/soi-lua-dao.webp"
	},
	"/characters/soi-hoa-binh.webp": {
		"type": "image/webp",
		"etag": "\"687a-d0rA8W16fIVzjDQUYVBKekpqIYk\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 26746,
		"path": "../public/characters/soi-hoa-binh.webp"
	},
	"/characters/soi-meo-con.png": {
		"type": "image/png",
		"etag": "\"30a2-a3DQGM2Wj1rT07HHLROlwJ6Yx8c\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 12450,
		"path": "../public/characters/soi-meo-con.png"
	},
	"/characters/soi-mu.png": {
		"type": "image/png",
		"etag": "\"31a4-HHtE1VOMxgYt2Kps2tcYVqTAmKM\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 12708,
		"path": "../public/characters/soi-mu.png"
	},
	"/characters/soi-phan-tach.webp": {
		"type": "image/webp",
		"etag": "\"52e8-gA5Hz0/BRnt9+iHjx05T1/3klEE\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 21224,
		"path": "../public/characters/soi-phan-tach.webp"
	},
	"/characters/soi-thach.png": {
		"type": "image/png",
		"etag": "\"2ca6-oew/LAzyK9lHs9f3rKM/4AoVpgs\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 11430,
		"path": "../public/characters/soi-thach.png"
	},
	"/characters/soi-thao-tung.png": {
		"type": "image/png",
		"etag": "\"a5e-G/zSSs8jeU+vXQP8Mp4qy6TFIyw\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 2654,
		"path": "../public/characters/soi-thao-tung.png"
	},
	"/characters/soi-tre.webp": {
		"type": "image/webp",
		"etag": "\"b68-vPZ8kvudxNVwW2irp/781UGIW6o\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 2920,
		"path": "../public/characters/soi-tre.webp"
	},
	"/characters/tham-tu.png": {
		"type": "image/png",
		"etag": "\"2eee-TCPfNvdDs9MZ2F/ugfI9yzHyuOI\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 12014,
		"path": "../public/characters/tham-tu.png"
	},
	"/characters/thang-ngo.png": {
		"type": "image/png",
		"etag": "\"26d0-5HIGXjtCzA5W+jS0cWg7ujZ+Xco\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 9936,
		"path": "../public/characters/thang-ngo.png"
	},
	"/characters/thay-dong.png": {
		"type": "image/png",
		"etag": "\"27e6-IPLcvoJOykHAYYZ+IeCAtZHoOaQ\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 10214,
		"path": "../public/characters/thay-dong.png"
	},
	"/characters/thi-truong.png": {
		"type": "image/png",
		"etag": "\"2a92-MjyK9G+Em6AsK/BR7UpJln80GgE\"",
		"mtime": "2026-09-01T11:03:45.604Z",
		"size": 10898,
		"path": "../public/characters/thi-truong.png"
	},
	"/characters/thien-xa.png": {
		"type": "image/png",
		"etag": "\"459c-D/NGFOUdI9DJ1Py7RPJOa9x4PD4\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 17820,
		"path": "../public/characters/thien-xa.png"
	},
	"/characters/tho-lam-banh.png": {
		"type": "image/png",
		"etag": "\"26d4-KFjkDO/mJvbEDeqPil0gTqcZbks\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 9940,
		"path": "../public/characters/tho-lam-banh.png"
	},
	"/characters/tho-phuc-sinh.png": {
		"type": "image/png",
		"etag": "\"3efa-ThZz5YM7vNtV1RgpWu6sjiu2piM\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 16122,
		"path": "../public/characters/tho-phuc-sinh.png"
	},
	"/characters/tho-ren.webp": {
		"type": "image/webp",
		"etag": "\"1984-IotDhkyiK2Wdw3nLBqt3xp+gIzk\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 6532,
		"path": "../public/characters/tho-ren.webp"
	},
	"/characters/tho-san-nguoi.png": {
		"type": "image/png",
		"etag": "\"5270-966kHPOpMqEuG0jM+P3M6A4JrZ4\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 21104,
		"path": "../public/characters/tho-san-nguoi.png"
	},
	"/characters/tien-tri-tap-su.webp": {
		"type": "image/webp",
		"etag": "\"41a2-A8651Uai5eNZDd1ihN6j5ZxREU0\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 16802,
		"path": "../public/characters/tien-tri-tap-su.webp"
	},
	"/characters/tien-tri.png": {
		"type": "image/png",
		"etag": "\"4d4c-LxfbPuvuF9hF1NOQngKl7hdFw9U\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 19788,
		"path": "../public/characters/tien-tri.png"
	},
	"/characters/tong-thong.webp": {
		"type": "image/webp",
		"etag": "\"25c2-R6L7/3T2YZUV57pUovfDPpDGK3U\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 9666,
		"path": "../public/characters/tong-thong.webp"
	},
	"/characters/vua-bi-ngo.webp": {
		"type": "image/webp",
		"etag": "\"3060-RtVY/i0MKayiLdccKW0AH0wzw0o\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 12384,
		"path": "../public/characters/vua-bi-ngo.webp"
	},
	"/characters/xa-thu.webp": {
		"type": "image/webp",
		"etag": "\"2040-0qToZbjMqzdbhKWeChpngJoM4wc\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 8256,
		"path": "../public/characters/xa-thu.webp"
	},
	"/characters/xac-song.png": {
		"type": "image/png",
		"etag": "\"4be6-cxXw5PiHpFc+IGsTDCX8Fi3eL18\"",
		"mtime": "2026-09-01T11:03:45.605Z",
		"size": 19430,
		"path": "../public/characters/xac-song.png"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260610-beta_@vercel+blob@2.8.0_chokidar@5.0.0_jiti@1.21.7_lru-cache@11.5.2_ro_f4e3573268e3f17912300a26d03707fa/node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_VlbT52 = defineLazyEventHandler(() => import("./_routes/api/ws.mjs"));
var _lazy_wTB64Y = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/api/ws",
		handler: _lazy_VlbT52
	}, $1 = {
		route: "/**",
		handler: _lazy_wTB64Y
	};
	return (m, p) => {
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		if (p === "/api/ws") return { data: $0 };
		let s = p.split("/");
		s.length;
		return {
			data: $1,
			params: { "_": s.slice(1).join("/") }
		};
	};
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260610-beta_@vercel+blob@2.8.0_chokidar@5.0.0_jiti@1.21.7_lru-cache@11.5.2_ro_f4e3573268e3f17912300a26d03707fa/node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260610-beta_@vercel+blob@2.8.0_chokidar@5.0.0_jiti@1.21.7_lru-cache@11.5.2_ro_f4e3573268e3f17912300a26d03707fa/node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function serverFetch(resource, init, context) {
	const req = toRequest(resource, init);
	req.context = {
		...req.context,
		...context
	};
	const appHandler = useNitroApp().fetch;
	try {
		return Promise.resolve(appHandler(req));
	} catch (error) {
		return Promise.reject(error);
	}
}
async function resolveWebsocketHooks(req) {
	return (await serverFetch(req)).crossws || {};
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260610-beta_@vercel+blob@2.8.0_chokidar@5.0.0_jiti@1.21.7_lru-cache@11.5.2_ro_f4e3573268e3f17912300a26d03707fa/node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260610-beta_@vercel+blob@2.8.0_chokidar@5.0.0_jiti@1.21.7_lru-cache@11.5.2_ro_f4e3573268e3f17912300a26d03707fa/node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
var server = serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
{
	const { handleUpgrade } = nodeAdapter({ resolve: resolveWebsocketHooks });
	server.node.server.on("upgrade", (req, socket, head) => {
		handleUpgrade(req, socket, head, new NodeRequest({
			req,
			upgrade: {
				socket,
				head
			}
		}));
	});
}
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
