//window.scrollTo($(window).width(),$(window).height()); // Saving for later...
$(document).ready(function(){

    space_h = 0;
    space_w = 0;

    // Setup our stars
    $('.star').each(function(){
        $(this)
            .css({
                height: 20,
                width: 20
            })
            .setCoords(Math.round(1000*Math.random()), Math.round(1000*Math.random()))
            
        coords = $(this).getCoords();
        if(coords[0] > space_w)
        {
            space_w = coords[0]
        }
        if(coords[1] > space_h)
        {
            space_h = coords[1]
        }
    });

    $('#mine').setCoords(300, 300)
    $(window).centerOn($('#mine').getCoords()[0], $('#mine').getCoords()[1]);
    $('.star').click(function(){ alert($(this).getCoords()); });
    
    // Our hand...
    $('#starfield').mousedown(function(){
        $('#starfield').css("cursor", "move")
    });
    $('#starfield').mouseup(function(){
        $('#starfield').css("cursor", "crosshair")
    });
    
    // Space!
    $('#space')
        .Draggable()
        .css({
            height: space_h,
            width: space_w
        })
    
});

// Get the position of a star
jQuery.fn.getCoords = function()
{
    x = $(this).css('left')
    x = (x.substring(0, x.length - 2) * 1) + ($(this).width() / 2);

    y = $(this).css('top')
    y = (y.substring(0, y.length - 2) * 1) + ($(this).height() / 2);

    return [x, y]
}

// Position an star to the right coords
jQuery.fn.setCoords = function(x, y)
{
    $(this).css({
        top: y - ($(this).height() / 2),
        left: x - ($(this).width() / 2)
    });
}

// Scroll the window
jQuery.fn.centerOn = function(x, y)
{
    window.scrollTo(x, y);
}
