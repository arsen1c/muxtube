import { CompleteMultipartUploadRequest, CreateMultipartUploadRequest, ListPartsRequest, UploadPartRequest } from "aws-sdk/clients/s3"
import { AWS_BUCKET_NAME } from "../config"
import awsProvider from "../config/aws.config"
import logger from "../config/logger"
import { Request, Response } from "express"

export const initUpload = async (req: Request, res: Response) => {
    try {
        logger.info("initializing upload...")

        const { filename } = req.body

        if (!filename) {
            return res.status(400).send("please send a filename")
        }

        const initUploadCommand: CreateMultipartUploadRequest = {
            Bucket: AWS_BUCKET_NAME as string,
            Key: filename as string,
            ContentType: "video/mp4"
        }

        const multipartParams = await awsProvider.s3.createMultipartUpload(initUploadCommand).promise()
        logger.info({ multipartParams })

        logger.info("upload id generated")
        return res.status(200).json({ data: multipartParams.UploadId })
    } catch (err: any) {
        logger.error(err)
        res.status(500).send(err.message)
    }
}

export const uploadPart = async (req: Request, res: Response) => {
    try {
        const { filename, uploadId, chunkIndex } = req.body
        logger.info(`uploading chunk to id ${uploadId}, chunk index: ${parseInt(chunkIndex) + 1}`)

        const uploadPartCommand: UploadPartRequest = {
            Bucket: AWS_BUCKET_NAME as string,
            Key: filename,
            UploadId: uploadId,
            PartNumber: parseInt(chunkIndex) + 1,
            Body: req.file?.buffer
        }

        // upload a chunk to a specific uploadId
        const _ = await awsProvider.s3.uploadPart(uploadPartCommand).promise()

        // no need to send the Etag returned in the data because we will be using 
        // the "listParts" method to grab the etags and partnumbers of all the parts
        return res.status(200).json({ success: true })
    } catch (err: any) {
        logger.error(err)
        res.status(500).send(err.message)
    }
}

export const completeUpload = async (req: Request, res: Response) => {
    try {
        const { filename, uploadId } = req.body
        logger.info(`completing upload ${uploadId}`)

        const listPartCommand: ListPartsRequest = {
            Bucket: AWS_BUCKET_NAME as string,
            UploadId: uploadId,
            Key: filename,
        }

        // list the parts uploaded to a specific upload and grab the Etag and PartNumber
        const data = await awsProvider.s3.listParts(listPartCommand).promise()

        // form a complete multipart upload request
        const completeParams: CompleteMultipartUploadRequest = {
            ...listPartCommand,
            MultipartUpload: {
                Parts: data.Parts?.map(part => ({
                    Etag: part.ETag,
                    PartNumber: part.PartNumber
                }))
            }
        }

        // call the completeMultipartUpload function to let AWS know that all the chunks are uploaded
        // and the assembly process can be started
        const uploadResult = await awsProvider.s3.completeMultipartUpload(completeParams).promise()
        logger.info(`data--------`, uploadResult)
    } catch (err: any) {
        logger.error(err)
        res.status(500).send(err.message)
    }
} 