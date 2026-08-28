import handlerOffer from './api/generate-offer.js';
import handlerCert from './api/generate-certificate.js';

const studentId = "4d564805-ebf3-4208-8059-602b75eb3ee9";
const internshipId = "c37a2171-7412-488b-9ab1-ccf01f0fb90e";
const courseName = "Full Stack Development";

async function run() {
    console.log("=== Testing Server-Side Document Automation Flow ===");

    // Mock response helpers
    const createMockResponse = (label) => {
        let code = 200;
        let headers = {};
        return {
            status(c) {
                code = c;
                return this;
            },
            setHeader(name, val) {
                headers[name] = val;
                return this;
            },
            json(data) {
                console.log(`\n[${label} RESPONSE JSON] Status: ${code}`);
                console.log(JSON.stringify(data, null, 2));
            },
            end(data) {
                console.log(`\n[${label} RESPONSE END] Status: ${code}`);
                if (data) console.log(data);
            }
        };
    };

    // 1. Test Offer Letter Generation
    const reqOffer = {
        method: 'POST',
        headers: { host: 'localhost:5173' },
        body: {
            studentId,
            internshipId
        }
    };
    console.log("\n-> Executing generate-offer...");
    await handlerOffer(reqOffer, createMockResponse("OFFER_LETTER"));

    // 2. Test Certificate Generation
    const reqCert = {
        method: 'POST',
        headers: { host: 'localhost:5173' },
        body: {
            studentId,
            courseName,
            internshipId,
            certificateNumber: `VINIX-CERT-TEST-${Math.floor(1000 + Math.random() * 9000)}`
        }
    };
    console.log("\n-> Executing generate-certificate...");
    await handlerCert(reqCert, createMockResponse("CERTIFICATE"));

    console.log("\n=== Testing Executed Successfully ===");
}

run().catch(err => {
    console.error("Test failed:", err);
});
