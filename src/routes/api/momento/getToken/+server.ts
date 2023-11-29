import { json } from "@sveltejs/kit";
import {
	AuthClient,
	CredentialProvider,
	DisposableTokenScopes,
	ExpiresIn,
	GenerateDisposableToken
} from "@gomomento/sdk";
import { MOMENTO_API_KEY } from "$env/static/private";

export async function POST({ request }) {
	const authClient = new AuthClient({
		credentialProvider: CredentialProvider.fromString({ apiKey: MOMENTO_API_KEY })
	});

	const oneKeyOneCacheToken = await authClient.generateDisposableToken(
		DisposableTokenScopes.topicPublishSubscribe("masse-breakers", "players"),

		// For testing. Change to 30 in prod
		ExpiresIn.minutes(1)
	);
	if (oneKeyOneCacheToken instanceof GenerateDisposableToken.Success) {
		console.log(
			'Generated a disposable API key with access to the "players" key in the "masse-breakers" cache!'
		);
		// logging only a substring of the tokens, because logging security credentials is not advisable :)
		console.log(`API key starts with: ${oneKeyOneCacheToken.authToken.substring(0, 10)}`);
		console.log(`Expires At: ${oneKeyOneCacheToken.expiresAt.epoch()}`);
	} else if (oneKeyOneCacheToken instanceof GenerateDisposableToken.Error) {
		throw new Error(
			`An error occurred while attempting to call generateApiKey with disposable token scope: ${oneKeyOneCacheToken.errorCode()}: ${oneKeyOneCacheToken.toString()}`
		);
	}

	return json({ token: oneKeyOneCacheToken });
}
