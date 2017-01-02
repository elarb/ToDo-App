var main = function (data) {
    "use strict";

    // FIELDS
    var todosperweek = [];
    var $todosperweekbutton = $(".todosperweekinput");


    $todosperweekbutton.on('click', function (event) {
        $(".tododiv").remove();
        $.get("/todosperweek", function (data) {
            var $todosperweek = $("<div>");
            $todosperweek.addClass('todosperweek');
            data.forEach(function (object) {
                var $week = $("<label>");
                var $count = $("<label>");

                $week.text(object.Week);
                $count.text(object.Count);

                var $tododiv = $("<div>");
                $tododiv.addClass("tododiv");
                $tododiv.append($week);
                $tododiv.append($count);

                $todosperweek.append($tododiv);

            });
            $("main .container").append($todosperweek);
        });
    });
};

$(document).ready(main);
