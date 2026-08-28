export default async function handler(req, res) {

    // Only allow POST
    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    try {

        const application = req.body;


        // Check received data
        if (
            !application ||
            typeof application !== "object"
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid application data"
            });

        }


        // Validate real name
        if (!application.realName) {

            return res.status(400).json({
                success: false,
                message: "Real name is required"
            });

        }


        // Validate situation 1
        if (!application.situation1) {

            return res.status(400).json({
                success: false,
                message: "Situation 1 answer is required"
            });

        }


        // Validate situation 2
        if (!application.situation2) {

            return res.status(400).json({
                success: false,
                message: "Situation 2 answer is required"
            });

        }


        // Log application
        console.log(
            "NEW APPLICATION:"
        );

        console.log(
            JSON.stringify(
                application,
                null,
                2
            )
        );


        // Return JSON
        return res.status(200).json({

            success: true,

            message:
                "Application submitted successfully"

        });


    } catch (error) {

        console.error(
            "APPLICATION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }

}