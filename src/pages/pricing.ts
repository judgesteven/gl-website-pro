export const GET = () => {
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/#pricing">
    <script>window.location.href= '/#pricing';</script>
</head>
<body><p>Redirecting to <a href="/#pricing">pricing section</a>...</p></body>
</html>
`, {
        status: 301,
        headers: {
            'Location': '/#pricing',
            'Content-Type': 'text/html'
        }
    });
};
