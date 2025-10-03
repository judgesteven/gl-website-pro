export const GET = () => {
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/#features">
    <script>window.location.href= '/#features';</script>
</head>
<body><p>Redirecting to <a href="/#features">features section</a>...</p></body>
</html>
`, {
        status: 301,
        headers: {
            'Location': '/#features',
            'Content-Type': 'text/html'
        }
    });
};
