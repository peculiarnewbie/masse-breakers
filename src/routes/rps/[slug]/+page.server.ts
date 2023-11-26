export function load({ params, cookies }) {
	const roomName = params.slug;

	return {
		roomName: roomName,
		cookies: cookies
	};
}
