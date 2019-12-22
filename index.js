const nodemailer = require("nodemailer");
const {
    google
} = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const mymail = "送信元のgmailアドレス";
const clientId = "OAuthのclientId";
const clientSecret = "OAuthのclientSecret";
const refreshToken = "//developers.google.com/oauthplaygroundで取得したrefreshToken";

exports.handler = async (event, context, callback) => {
    //netlify formのqueryをparseして自動返信先のメールアドレスを取得.
    const tomail = JSON.parse(event.body).email;

    const start = async () => {
        const oauth2Client = new OAuth2(
            clientId,
            clientSecret,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });
        //アクセストークンに制限時間があるっぽい？ので毎度取得します。
        const accessToken = await oauth2Client.getAccessToken()

        const smtpTransport = nodemailer.createTransport({
            service: "gmail",
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: "OAuth2",
                user: mymail,
                clientId: clientId,
                clientSecret: clientSecret,
                refreshToken: refreshToken,
                accessToken: accessToken
            }
        });

        const sendMail = async (mailingList) => {
            const mailOptions = {
                from: mymail,
                to: mailingList.join(', '),
                subject: "お問い合わせありがとうございます。",
                text: `${JSON.parse(event.body).email}様、お問い合わせありがとうございます。`
            };
            return await new Promise((resolve, reject) => {
                smtpTransport.sendMail(mailOptions, (error, response) => {
                    error ? console.log(error) : console.log(response);
                    smtpTransport.close();
                    resolve();
                });
            });
        };

        await sendMail([tomail, mymail]);
        return;
    }

    await start().then(() => console.log('done'));

    
    //aws lambdaでは、responseの形式が決まっているので、適当に記述。
    const response = {
        statusCode: 200,
        headers: {
            "x-custom-header" : "netlify forms test"
        },
        body: JSON.stringify(event)
    };

    return response;
};