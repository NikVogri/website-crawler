const axios = require("axios");

async function getHtml(url) {
	try {
		const res = await axios.get(url);
		return res.data;
	} catch (error) {
		console.log(`[!] Error getting ${url}`);
	}
}

function parseUrls(html) {
	const urls = [];

	const matches = html.match(/<a[\s]+([^>]+)>((?:.(?!\<\/a\>))*.)<\/a>/g);
	if (matches === null) return urls;

	const anchorTags = [...matches];

	for (const anchorTag of anchorTags) {
		const path = /href="([^"]+)"/g.exec(anchorTag)?.[1];
		if (!path) continue;

		// if outside URL or a duplicate
		if (path.startsWith("http") || urls.includes(path) || path === "/" || path.includes("mailto")) continue;

		urls.push(path);
	}

	return urls;
}

function buildUrl(domain, path) {
	if (domain[domain.length - 1] === "/" && path.startsWith("/")) return `${domain}${path.slice(1)}`;
	else if (domain[domain.length - 1] === "/" && !path.startsWith("/")) return `${domain}${path}`;
	else if (domain[domain.length - 1] !== "/" && path.startsWith("/")) return `${domain}${path}`;
	else return `${domain}/${path}`;
}

(async () => {
	try {
		const url = process.argv[2];
		if (!url) throw new Error("[!] Missing website URL argument");

		const pages = await scanWebsite(url);
		console.log(pages);
	} catch (error) {
		console.log(error);
	}
})();

async function scanWebsite(domain) {
	let urlsToScan = [domain];
	const visited = {};
	const pages = {};

	while (urlsToScan.length) {
		const path = urlsToScan.shift();
		console.log("[*] Scanning URL: " + path);

		if (visited[path]) continue;
		visited[path] = true;

		let html = await getHtml(path);
		if (!html) continue;

		const paths = parseUrls(html);
		const urls = paths.map((path) => buildUrl(domain, path));

		pages[path] = {
			children: {
				total: urls.length,
				urls: urls,
			},
		};

		if (urls && urls.length > 0) {
			urlsToScan.push(...urls);
		}
	}

	return pages;
}
