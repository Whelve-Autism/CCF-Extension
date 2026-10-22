// Manifest permissions and this guard both restrict execution to Google Scholar.
if (
  /^scholar\.google\.(?:[a-z]{2,3}|(?:co|com)\.[a-z]{2})$/i.test(
    window.location.hostname,
  )
) {
  scholar.run();
}
