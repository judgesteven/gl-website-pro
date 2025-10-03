export const GET = () => {
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/#showcase">
    <script>window.location.href= '/#showcase';</script>
</head>
<body><p>Redirecting to <a href="/#showcase">customer showcase</a>...</p></body>
</html>
`, {
        status: 301,
        headers: {
            'Location': '/#showcase',
            'Content-Type': 'text/html'
        }
    });
};
