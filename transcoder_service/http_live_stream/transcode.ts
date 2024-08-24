import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import fs from "node:fs"
import { resolve } from "node:path"

if (!ffmpegStatic) {
    throw new Error('ffmpeg-static module did not return a valid path to ffmpeg');
}
ffmpeg.setFfmpegPath(ffmpegStatic)

type resolutionMetaData = {
    resolution: string;
    videoBitrate: string;
    audioBitrate: string
}
type TVariantPlaylist = {
    resolution: string;
    outputFileName: string;
}

const RESOLUTIONS: resolutionMetaData[] = [
    {
        resolution: '320x180',
        videoBitrate: '500k',
        audioBitrate: '64k'
    },
    {
        resolution: '854x480',
        videoBitrate: '1000k',
        audioBitrate: '128k'
    },
    {
        resolution: '1280x720',
        videoBitrate: '2500k',
        audioBitrate: '192k'
    }
]

// HLS is http live streaming
const convertVideoToHLS = async () => {
    const mp4fileName = "test.mp4"
    const variantPlaylists: TVariantPlaylist[] = []

    // loop through each resolution and convert the file for that resolution
    for (const { audioBitrate, resolution, videoBitrate } of RESOLUTIONS) {
        console.log(`HLS conversation starting for ${resolution}`)
        // create .m3u8 files
        const outputFileName = `${mp4fileName.replace(
            ".",
            "_"
        )}_${resolution}.m3u8`

        // create .ts files
        const segmentFileName = `${mp4fileName.replace(
            ".",
            "_"
        )}_${resolution}_%03d.ts`

        // generate .ts and m3u8 file after encoding the mp4 file
        const testFilePath = resolve(__dirname, `../../${mp4fileName}`) // the test file will be in the root directory 
        await new Promise((resolve, reject): void => {
            ffmpeg(testFilePath)
                .outputOption([
                    `-c:v h264`,
                    `-b:v ${videoBitrate}`,
                    `-c:a aac`,
                    `-b:a ${audioBitrate}`,
                    `-vf scale=${resolution}`,
                    `-f hls`,
                    `-hls_time 10`,
                    `-hls_list_size 0`,
                    `-hls_segment_filename output/${segmentFileName}`
                ])
                .output(`output/${outputFileName}`)
                .on("end", () => resolve(null))
                .on("error", (err) => reject(err))
                .run()
        })

        const variantPlaylist: TVariantPlaylist = {
            resolution,
            outputFileName
        }

        variantPlaylists.push(variantPlaylist)
    }

    console.log(`HLS master m3u8 playlist generating...`)
    let masterPlaylist = variantPlaylists
        .map(variantPlaylist => {
            const { outputFileName, resolution } = variantPlaylist

            // set bandwidth for each resolution
            const bandwidth =
                resolution === "320x180" ? 676800 : resolution === "854x480" ? 1353600 : 3230400


            return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${outputFileName}`;
        })
        .join("\n")

    masterPlaylist = `#EXTM3U\n` + masterPlaylist

    const masterPlaylistFileName = `${mp4fileName.replace(
        ".",
        "_"
    )}_master.m3u8`

    // write the master file in the output folder
    const masterPlaylistPath = `output/${masterPlaylistFileName}`
    fs.writeFileSync(masterPlaylistPath, masterPlaylist)
    console.log(`HLS master m3u8 playlist generated.`)
}

convertVideoToHLS()