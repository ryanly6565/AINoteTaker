import {NextApiHandler, NextApiResponse, NextApiRequest} from "next";
import {getIronSession} from "iron-session";
import {SessionData, sessionOptions} from "@/lib/lib";

/**
 * Wrapper function to authenticate routes.
 */
export default function withAuth(handler: NextApiHandler) {
    return async(req: NextApiRequest, res: NextApiResponse) => {
        const session = await getIronSession<SessionData>(req, res, sessionOptions);
        if (!session.isLoggedIn) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Set session data to avoid fetching again in endpoints
        // NOTE: Should probably save in req.session, but I was lazy
        (req as any).userId = session.userId;

        return handler(req, res);
    }
}