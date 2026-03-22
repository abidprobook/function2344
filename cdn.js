/*
 * Local Node.js version of cdnsports
 * To run: node cdnsports.js
 * To save to file: node cdnsports.js > full_playlist.m3u
 */

const referer_url = "https://edge.cdn-live.ru/";

async function get_online_channels(referer) {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": referer,
        "Accept": "application/json"
    };
    try {
        const response = await fetch("https://api.cdn-live.tv/api/v1/channels/?user=cdnlivetv&plan=free", { headers });
        if (!response.ok) return [];
        const data = await response.json();
        const all_channels = data.channels || [];
        const online_channels = all_channels.filter(ch => ch.status === 'online');
        
        const sports_keywords = [
            'sport', 'sports', 'football', 'cricket', 'espn','wwe','premier league', 'liga',
            'dazn', 'tnt sports', 'sky sports', 'bein sports', 'fox sports',
            'supersport', 'arena', 'match','sportv', 'premier', 'tyc sports', 'eleven sports', 'polsat sport','ssc', 'sony ten'
        ];

        return online_channels.filter(channel => {
            const channel_name = (channel.name || '').toLowerCase();
            return sports_keywords.some(keyword => channel_name.includes(keyword));
        });
    } catch (error) {
        process.stderr.write(`Error fetching channels: ${error.message}\n`);
        return [];
    }
}

// ... (Baaki functions get_m3u8_url wagera yahan aayenge) ...

async function run() {
    process.stderr.write("Fetching online sports channels...\n");
    let sports_channels = await get_online_channels(referer_url);
    
    process.stderr.write(`Found ${sports_channels.length} channels. Processing links...\n`);
    
    console.log('#EXTM3U x-tvg-url="https://github.com/epgshare01/share/raw/master/epg_ripper_ALL_SOURCES1.xml.gz"');

    // Local machine par hum large batches use kar saktay hain
    const BATCH_SIZE = 15;
    for (let i = 0; i < sports_channels.length; i += BATCH_SIZE) {
        const batch = sports_channels.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (channel) => {
            try {
                const m3u8_url = await get_m3u8_url(channel.url, referer_url);
                if (m3u8_url) {
                    process.stdout.write(`#EXTINF:-1 tvg-id="${channel.code}" tvg-name="${channel.name}" tvg-logo="${channel.image}",${channel.name}\n`);
                    process.stdout.write(`#EXTVLCOPT:http-referrer=${referer_url}\n`);
                    process.stdout.write(`${m3u8_url}\n`);
                }
            } catch (e) {}
        }));
        process.stderr.write(`Processed ${Math.min(i + BATCH_SIZE, sports_channels.length)}/${sports_channels.length} channels...\n`);
    }
    process.stderr.write("Done!\n");
}

run();
