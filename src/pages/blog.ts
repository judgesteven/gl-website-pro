export const GET = () => {
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/">
    <script>window.location.href= '/';</script>
</head>
<body><p>Redirecting to <a href="/">homepage</a>...</p></body>
</html>
`, {
        status: 301,
        headers: {
            'Location': '/',
            'Content-Type': 'text/html'
        }
    });
};
