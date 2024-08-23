import AWS from "aws-sdk"
import { AWS_ACCESS_KEY, AWS_ACCESS_SECRET_KEY } from "."

const awsProvider = {
    s3: new AWS.S3({
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_ACCESS_SECRET_KEY,
        region: "us-east-2"
    })
}

export default awsProvider